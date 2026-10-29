import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole, PlatformRoleType } from '@edunexa/shared';
import { hashPassword } from '../../utils/crypto.js';
import { emailService } from '../../services/email.service.js';

export interface ProvisionAccountParams {
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: PlatformRoleType;
  actingUserRole: PlatformRoleType;
  actingUserId?: string;
  sendInvitation?: boolean;
  isAssistedActivation?: boolean;
  schoolName?: string;
}

export interface ProvisionAccountResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  membership: {
    id: string;
    schoolId: string;
    role: PlatformRoleType;
    isActive: boolean;
  };
  invitation?: {
    id: string;
    status: string;
    deliveryStatus?: string | null;
    expiresAt: Date;
    isAssisted: boolean;
    assistedCode?: string | null;
  };
  rawActivationToken?: string;
  assistedActivationCode?: string;
}

export class AccountProvisioningService {
  /**
   * Enforces role assignment authorization boundaries
   */
  validateRoleAssignment(actingRole: PlatformRoleType, targetRole: PlatformRoleType): void {
    if (actingRole === PlatformRole.SUPER_ADMIN) {
      return; // Platform superadmin can assign any role
    }

    // A School Admin or Principal must NEVER create or promote a Super Admin
    if (targetRole === PlatformRole.SUPER_ADMIN) {
      throw new AppError(
        'Privilege escalation forbidden. School administrators cannot provision Super Admin accounts.',
        403,
        'FORBIDDEN_ROLE_ESCALATION'
      );
    }

    if (actingRole === PlatformRole.SCHOOL_ADMIN) {
      const allowedRoles: PlatformRoleType[] = [
        PlatformRole.SCHOOL_ADMIN,
        PlatformRole.PRINCIPAL,
        PlatformRole.TEACHER,
        PlatformRole.STUDENT,
        PlatformRole.PARENT,
        PlatformRole.EXAM_COORDINATOR,
        PlatformRole.HR_STAFF,
        PlatformRole.ACCOUNTS,
      ];
      if (!allowedRoles.includes(targetRole)) {
        throw new AppError(
          `School Administrators are not authorized to assign role '${targetRole}'.`,
          403,
          'UNAUTHORIZED_ROLE_ASSIGNMENT'
        );
      }
      return;
    }

    if (actingRole === PlatformRole.PRINCIPAL) {
      const allowedRoles: PlatformRoleType[] = [
        PlatformRole.TEACHER,
        PlatformRole.STUDENT,
        PlatformRole.PARENT,
        PlatformRole.EXAM_COORDINATOR,
        PlatformRole.HR_STAFF,
        PlatformRole.ACCOUNTS,
      ];
      if (!allowedRoles.includes(targetRole)) {
        throw new AppError(
          `Principals are not authorized to assign administrative role '${targetRole}'.`,
          403,
          'UNAUTHORIZED_ROLE_ASSIGNMENT'
        );
      }
      return;
    }

    throw new AppError(
      `Role '${actingRole}' does not possess account provisioning authorization.`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  /**
   * Validates password strength for account activation
   */
  validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400, 'WEAK_PASSWORD');
    }
    if (!/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one uppercase letter.', 400, 'WEAK_PASSWORD');
    }
    if (!/[a-z]/.test(password)) {
      throw new AppError('Password must contain at least one lowercase letter.', 400, 'WEAK_PASSWORD');
    }
    if (!/[0-9]/.test(password)) {
      throw new AppError('Password must contain at least one numeric digit.', 400, 'WEAK_PASSWORD');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new AppError('Password must contain at least one special character.', 400, 'WEAK_PASSWORD');
    }
  }

  /**
   * Centralized account creation / linking transaction
   */
  async provisionAccount(
    tx: any,
    params: ProvisionAccountParams
  ): Promise<ProvisionAccountResult> {
    this.validateRoleAssignment(params.actingUserRole, params.role);

    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Find or create the User identity (prevents duplicate users across schools)
    let user = await tx.user.findUnique({
      where: { email: cleanEmail },
    });

    const isNewUser = !user;

    if (!user) {
      // Unpredictable random initial password hash; user must activate
      const randomSeed = crypto.randomBytes(32).toString('hex');
      const tempHash = await hashPassword(randomSeed);

      user = await tx.user.create({
        data: {
          email: cleanEmail,
          firstName: params.firstName.trim(),
          lastName: params.lastName.trim(),
          phone: params.phone?.trim() || null,
          passwordHash: tempHash,
          isActive: false, // Inactive until account activation
          mustChangePassword: true,
        },
      });
    }

    // 2. Find or create UserMembership for this school tenant
    let membership = await tx.userMembership.findUnique({
      where: {
        userId_schoolId_role: {
          userId: user.id,
          schoolId: params.schoolId,
          role: params.role as any,
        },
      },
    });

    if (!membership) {
      membership = await tx.userMembership.create({
        data: {
          userId: user.id,
          schoolId: params.schoolId,
          role: params.role as any,
          isPrimary: isNewUser,
          isActive: false, // Activated when account is activated
        },
      });
    }

    let invitationRecord: any = null;
    let rawActivationToken: string | undefined;
    let assistedActivationCode: string | undefined;

    // 3. If invitation is requested, generate secure token and invitation record
    if (params.sendInvitation !== false) {
      // Revoke any previous pending invitations for this user and school
      await tx.accountInvitation.updateMany({
        where: {
          schoolId: params.schoolId,
          userId: user.id,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      // Generate cryptographically random token
      rawActivationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex');

      // 7 days token expiration
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // If assisted activation (e.g. students without personal email)
      if (params.isAssistedActivation) {
        assistedActivationCode = `ACT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      invitationRecord = await tx.accountInvitation.create({
        data: {
          schoolId: params.schoolId,
          userId: user.id,
          role: params.role as any,
          email: cleanEmail,
          tokenHash,
          status: 'PENDING',
          expiresAt,
          sentAt: params.isAssistedActivation ? null : new Date(),
          lastAttemptAt: new Date(),
          deliveryStatus: params.isAssistedActivation ? 'ASSISTED_MANUAL' : 'SENT',
          invitedByUserId: params.actingUserId || null,
          isAssisted: Boolean(params.isAssistedActivation),
          assistedCode: assistedActivationCode || null,
        },
      });

      // If not assisted and email provided, dispatch email notification
      if (!params.isAssistedActivation && cleanEmail.includes('@')) {
        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const activationUrl = `${clientOrigin.replace(/\/$/, '')}/activate?token=${rawActivationToken}`;
        const recipientName = `${params.firstName} ${params.lastName}`;
        const schoolName = params.schoolName || 'EduNexa Partner School';

        // Fire-and-forget or sync delivery
        const deliveryResult = await emailService.sendInvitationEmail({
          to: cleanEmail,
          recipientName,
          schoolName,
          role: params.role,
          activationUrl,
          expiresAt,
        });

        if (!deliveryResult.success) {
          await tx.accountInvitation.update({
            where: { id: invitationRecord.id },
            data: {
              deliveryStatus: 'FAILED',
              deliveryError: deliveryResult.deliveryError,
            },
          });
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
      membership: {
        id: membership.id,
        schoolId: membership.schoolId,
        role: membership.role,
        isActive: membership.isActive,
      },
      invitation: invitationRecord
        ? {
            id: invitationRecord.id,
            status: invitationRecord.status,
            deliveryStatus: invitationRecord.deliveryStatus,
            expiresAt: invitationRecord.expiresAt,
            isAssisted: invitationRecord.isAssisted,
            assistedCode: invitationRecord.assistedCode,
          }
        : undefined,
      rawActivationToken,
      assistedActivationCode,
    };
  }

  /**
   * Verifies an activation token or assisted code without revealing secrets
   */
  async verifyInvitation(tokenOrCode: string) {
    if (!tokenOrCode || tokenOrCode.trim().length < 6) {
      throw new AppError('Activation token is invalid or missing.', 400, 'INVALID_TOKEN');
    }

    const cleanInput = tokenOrCode.trim();
    const isAssistedCode = cleanInput.toUpperCase().startsWith('ACT-');

    let invitation: any = null;

    if (isAssistedCode) {
      invitation = await prisma.accountInvitation.findFirst({
        where: {
          assistedCode: { equals: cleanInput, mode: 'insensitive' },
          status: 'PENDING',
        },
        include: {
          school: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    } else {
      const tokenHash = crypto.createHash('sha256').update(cleanInput).digest('hex');
      invitation = await prisma.accountInvitation.findFirst({
        where: {
          tokenHash,
          status: 'PENDING',
        },
        include: {
          school: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    if (!invitation) {
      throw new AppError('Activation token is invalid or has already been used.', 404, 'TOKEN_NOT_FOUND');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.accountInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new AppError('This activation token has expired. Please request a new invitation from your school administrator.', 400, 'TOKEN_EXPIRED');
    }

    return {
      valid: true,
      email: invitation.user.email,
      recipientName: `${invitation.user.firstName} ${invitation.user.lastName}`,
      role: invitation.role,
      schoolName: invitation.school.name,
      isAssisted: invitation.isAssisted,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Activates account, sets verified password, and transitions status to ACTIVE
   */
  async activateAccount(tokenOrCode: string, plainTextPassword: string) {
    this.validatePasswordStrength(plainTextPassword);

    const cleanInput = tokenOrCode.trim();
    const isAssistedCode = cleanInput.toUpperCase().startsWith('ACT-');

    let invitation: any = null;

    if (isAssistedCode) {
      invitation = await prisma.accountInvitation.findFirst({
        where: {
          assistedCode: { equals: cleanInput, mode: 'insensitive' },
          status: 'PENDING',
        },
        include: {
          school: true,
          user: true,
        },
      });
    } else {
      const tokenHash = crypto.createHash('sha256').update(cleanInput).digest('hex');
      invitation = await prisma.accountInvitation.findFirst({
        where: {
          tokenHash,
          status: 'PENDING',
        },
        include: {
          school: true,
          user: true,
        },
      });
    }

    if (!invitation) {
      throw new AppError('Invalid or expired activation token.', 400, 'INVALID_TOKEN');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.accountInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new AppError('Activation token has expired.', 400, 'TOKEN_EXPIRED');
    }

    const newPasswordHash = await hashPassword(plainTextPassword);

    return prisma.$transaction(async (tx) => {
      // 1. Activate User account
      const updatedUser = await tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash: newPasswordHash,
          isActive: true,
          mustChangePassword: false,
        },
      });

      // 2. Activate specific School Membership
      await tx.userMembership.updateMany({
        where: {
          userId: invitation.userId,
          schoolId: invitation.schoolId,
          role: invitation.role,
        },
        data: {
          isActive: true,
        },
      });

      // 3. Mark Invitation as ACCEPTED
      await tx.accountInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // 4. Invalidate any remaining invitations for this user & school
      await tx.accountInvitation.updateMany({
        where: {
          schoolId: invitation.schoolId,
          userId: invitation.userId,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      // 5. Write Audit Log
      await tx.auditLog.create({
        data: {
          schoolId: invitation.schoolId,
          userId: invitation.userId,
          action: 'ACCOUNT_ACTIVATED',
          entityType: 'USER_ACCOUNT',
          entityId: invitation.userId,
          details: {
            role: invitation.role,
            isAssisted: invitation.isAssisted,
            activatedAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        email: updatedUser.email,
        role: invitation.role,
        schoolSlug: invitation.school.slug,
        schoolName: invitation.school.name,
      };
    });
  }

  /**
   * Resends invitation with a fresh token
   */
  async resendInvitation(schoolId: string, invitationId: string, actingUserId: string) {
    const existing = await prisma.accountInvitation.findFirst({
      where: {
        id: invitationId,
        schoolId,
      },
      include: {
        user: true,
        school: true,
      },
    });

    if (!existing) {
      throw new AppError('Invitation record not found.', 404, 'INVITATION_NOT_FOUND');
    }

    if (existing.status === 'ACCEPTED') {
      throw new AppError('Account is already activated. Cannot resend an accepted invitation.', 400, 'ACCOUNT_ALREADY_ACTIVATED');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.accountInvitation.update({
      where: { id: existing.id },
      data: {
        tokenHash,
        status: 'PENDING',
        expiresAt,
        lastAttemptAt: new Date(),
        invitedByUserId: actingUserId,
      },
    });

    if (!existing.isAssisted && existing.email && existing.email.includes('@')) {
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const activationUrl = `${clientOrigin.replace(/\/$/, '')}/activate?token=${rawToken}`;

      const delivery = await emailService.sendInvitationEmail({
        to: existing.email,
        recipientName: `${existing.user.firstName} ${existing.user.lastName}`,
        schoolName: existing.school.name,
        role: existing.role,
        activationUrl,
        expiresAt,
      });

      await prisma.accountInvitation.update({
        where: { id: existing.id },
        data: {
          deliveryStatus: delivery.success ? 'SENT' : 'FAILED',
          deliveryError: delivery.deliveryError || null,
          sentAt: delivery.success ? new Date() : existing.sentAt,
        },
      });
    }

    return {
      id: updated.id,
      email: existing.email,
      role: existing.role,
      status: updated.status,
      expiresAt: updated.expiresAt,
      rawToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  /**
   * Revokes an outstanding invitation
   */
  async revokeInvitation(schoolId: string, invitationId: string, actingUserId: string, reason?: string) {
    const existing = await prisma.accountInvitation.findFirst({
      where: {
        id: invitationId,
        schoolId,
      },
    });

    if (!existing) {
      throw new AppError('Invitation record not found.', 404, 'INVITATION_NOT_FOUND');
    }

    if (existing.status === 'ACCEPTED') {
      throw new AppError('Cannot revoke an invitation that has already been accepted.', 400, 'INVITATION_ALREADY_ACCEPTED');
    }

    const revoked = await prisma.accountInvitation.update({
      where: { id: existing.id },
      data: {
        status: 'REVOKED',
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: actingUserId,
        action: 'INVITATION_REVOKED',
        entityType: 'ACCOUNT_INVITATION',
        entityId: existing.id,
        details: { reason: reason || 'Revoked by school administrator' },
      },
    });

    return revoked;
  }

  /**
   * Lists invitations for a school tenant with pagination and status filtering
   */
  async listInvitations(schoolId: string, statusFilter?: string) {
    const where: any = { schoolId };
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const items = await prisma.accountInvitation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return items.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      email: inv.email || inv.user.email,
      recipientName: `${inv.user.firstName} ${inv.user.lastName}`,
      role: inv.role,
      status: inv.status,
      deliveryStatus: inv.deliveryStatus,
      deliveryError: inv.deliveryError,
      isAssisted: inv.isAssisted,
      assistedCode: inv.assistedCode,
      expiresAt: inv.expiresAt,
      sentAt: inv.sentAt,
      lastAttemptAt: inv.lastAttemptAt,
      acceptedAt: inv.acceptedAt,
      userIsActive: inv.user.isActive,
    }));
  }

  /**
   * Suspends or reactivates an account within the school tenant
   */
  async updateAccountStatus(schoolId: string, userId: string, isActive: boolean, actingUserId: string, reason?: string) {
    const membership = await prisma.userMembership.findFirst({
      where: {
        userId,
        schoolId,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new AppError('User membership not found in this school.', 404, 'MEMBERSHIP_NOT_FOUND');
    }

    if (membership.role === PlatformRole.SUPER_ADMIN) {
      throw new AppError('School administrators cannot modify platform Super Admin accounts.', 403, 'FORBIDDEN_OPERATION');
    }

    await prisma.$transaction(async (tx) => {
      await tx.userMembership.update({
        where: { id: membership.id },
        data: { isActive },
      });

      // If user has no other active memberships, toggle global user status
      const activeMemberships = await tx.userMembership.count({
        where: { userId, isActive: true },
      });

      if (activeMemberships === 0 && !isActive) {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: false },
        });
      } else if (isActive) {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: true },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: actingUserId,
          action: isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
          entityType: 'USER_ACCOUNT',
          entityId: userId,
          details: {
            targetUserEmail: membership.user.email,
            targetRole: membership.role,
            reason: reason || (isActive ? 'Reactivated by administrator' : 'Suspended by administrator'),
          },
        },
      });
    });

    return {
      userId,
      schoolId,
      isActive,
      role: membership.role,
    };
  }
}

export const accountProvisioningService = new AccountProvisioningService();

