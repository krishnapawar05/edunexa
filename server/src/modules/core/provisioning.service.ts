import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole, PlatformRoleType, BulkActionResponse, BulkItemResult } from '@edunexa/shared';
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
    username?: string | null;
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

      let usernameCandidate = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (usernameCandidate.length < 3) {
        usernameCandidate = `user.${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const existingUserWithUsername = await tx.user.findFirst({
        where: { username: { equals: usernameCandidate, mode: 'insensitive' } },
      });
      if (existingUserWithUsername) {
        usernameCandidate = `${usernameCandidate}.${Math.floor(100 + Math.random() * 900)}`;
      }

      user = await tx.user.create({
        data: {
          email: cleanEmail,
          username: usernameCandidate,
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
        username: user.username,
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

    const actingDbUser = actingUserId
      ? await prisma.user.findFirst({
          where: {
            OR: [
              { id: actingUserId },
              { email: actingUserId },
              { email: 'admin@apexacademy.edu' },
            ],
          },
        })
      : null;

    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: actingDbUser ? actingDbUser.id : null,
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
        schoolId,
        OR: [
          { userId },
          { user: { id: userId } },
          { user: { email: userId } },
        ],
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

    const actingDbUser = actingUserId
      ? await prisma.user.findFirst({
          where: {
            OR: [
              { id: actingUserId },
              { email: actingUserId },
              { email: 'admin@apexacademy.edu' },
            ],
          },
        })
      : null;
    const resolvedActingUserId = actingDbUser ? actingDbUser.id : null;

    await prisma.$transaction(async (tx) => {
      await tx.userMembership.update({
        where: { id: membership.id },
        data: { isActive },
      });

      // If user has no other active memberships, toggle global user status
      const activeMemberships = await tx.userMembership.count({
        where: { userId: membership.userId, isActive: true },
      });

      if (activeMemberships === 0 && !isActive) {
        await tx.user.update({
          where: { id: membership.userId },
          data: { isActive: false },
        });
      } else if (isActive) {
        await tx.user.update({
          where: { id: membership.userId },
          data: { isActive: true },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId,
          userId: resolvedActingUserId,
          action: isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
          entityType: 'USER_ACCOUNT',
          entityId: membership.userId,
          details: {
            targetUserEmail: membership.user.email,
            targetRole: membership.role,
            reason: reason || (isActive ? 'Reactivated by administrator' : 'Suspended by administrator'),
          },
        },
      });
    });

    return {
      userId: membership.userId,
      schoolId,
      isActive,
      role: membership.role,
    };
  }

  /**
   * Generates a cryptographically secure 14-character temporary password
   */
  generateSecureTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*';

    let pass = '';
    pass += upper[crypto.randomInt(0, upper.length)];
    pass += lower[crypto.randomInt(0, lower.length)];
    pass += digits[crypto.randomInt(0, digits.length)];
    pass += special[crypto.randomInt(0, special.length)];

    const allChars = upper + lower + digits + special;
    for (let i = 4; i < 14; i++) {
      pass += allChars[crypto.randomInt(0, allChars.length)];
    }

    return pass
      .split('')
      .sort(() => crypto.randomInt(0, 3) - 1)
      .join('');
  }

  /**
   * Lists all user accounts and memberships within a school tenant with multi-criteria filtering
   */
  async listTenantUsers(
    schoolIdOrSlug: string,
    filters: { role?: string; search?: string; status?: string; page?: number; limit?: number } = {}
  ) {
    const school = await prisma.school.findFirst({
      where: {
        OR: [{ id: schoolIdOrSlug }, { slug: schoolIdOrSlug }, { code: schoolIdOrSlug }],
      },
    });
    const schoolId = school ? school.id : schoolIdOrSlug;

    const where: any = { schoolId };

    if (filters.role && filters.role !== 'ALL') {
      where.role = filters.role;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.user = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    if (filters.status && filters.status !== 'ALL') {
      const st = filters.status.toUpperCase();
      if (st === 'ACTIVE') {
        where.isActive = true;
        where.user = {
          ...where.user,
          isActive: true,
          accountLocked: false,
        };
      } else if (st === 'INACTIVE' || st === 'SUSPENDED') {
        where.OR = [
          { isActive: false },
          { user: { isActive: false } },
        ];
      } else if (st === 'LOCKED') {
        where.user = {
          ...where.user,
          accountLocked: true,
        };
      } else if (st === 'MUST_CHANGE_PASSWORD') {
        where.user = {
          ...where.user,
          mustChangePassword: true,
        };
      }
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, memberships] = await Promise.all([
      prisma.userMembership.count({ where }),
      prisma.userMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
              accountLocked: true,
              failedLoginAttempts: true,
              lockoutUntil: true,
              mustChangePassword: true,
              passwordResetAt: true,
              passwordChangedAt: true,
              createdAt: true,
            },
          },
          studentProfile: {
            select: {
              id: true,
              admissionNumber: true,
              status: true,
            },
          },
          staffProfile: {
            select: {
              id: true,
              employeeId: true,
              designation: true,
              employmentStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const users = memberships.map((m) => {
      const isLocked = m.user.accountLocked || Boolean(m.user.lockoutUntil && new Date() < m.user.lockoutUntil);
      return {
        id: m.user.id,
        membershipId: m.id,
        schoolId: m.schoolId,
        email: m.user.email,
        username: m.user.username,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        phone: m.user.phone,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        isActive: m.isActive && m.user.isActive,
        accountLocked: isLocked,
        failedLoginAttempts: m.user.failedLoginAttempts,
        lockoutUntil: m.user.lockoutUntil,
        mustChangePassword: m.user.mustChangePassword,
        passwordResetAt: m.user.passwordResetAt,
        passwordChangedAt: m.user.passwordChangedAt,
        createdAt: m.user.createdAt,
        studentProfile: m.studentProfile,
        staffProfile: m.staffProfile,
      };
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Administrator resets a user's password directly with PostgreSQL persistence
   * Supports temporary password generation or manual specification, marks mustChangePassword,
   * invalidates prior sessions, and records audit log.
   */
  async adminResetPassword(params: {
    schoolId?: string;
    targetUserId: string;
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    actingUserId?: string;
    actingUserRole: PlatformRoleType;
    reason?: string;
  }) {
    const school = params.schoolId
      ? await prisma.school.findFirst({
          where: {
            OR: [{ id: params.schoolId }, { slug: params.schoolId }, { code: params.schoolId }],
          },
        })
      : null;
    const targetSchoolId = school ? school.id : params.schoolId;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: params.targetUserId },
          { email: params.targetUserId },
        ],
      },
      include: {
        memberships: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Target user account not found.', 404, 'USER_NOT_FOUND');
    }

    // Role and tenant authorization boundaries
    let targetMembership = user.memberships[0];

    if (params.actingUserRole !== PlatformRole.SUPER_ADMIN) {
      if (!targetSchoolId) {
        throw new AppError('School tenant ID is required to reset user password.', 400, 'MISSING_SCHOOL_ID');
      }

      const match = user.memberships.find((m) => m.schoolId === targetSchoolId);
      if (!match) {
        throw new AppError('User not found within your school tenant.', 404, 'USER_NOT_FOUND');
      }
      targetMembership = match;

      // Prevent resetting platform Super Admin accounts
      const hasSuperAdminRole = user.memberships.some((m) => m.role === PlatformRole.SUPER_ADMIN);
      if (hasSuperAdminRole) {
        throw new AppError('School administrators cannot reset passwords for platform Super Admin accounts.', 403, 'FORBIDDEN_OPERATION');
      }

      // Principal cannot reset School Admin
      if (params.actingUserRole === PlatformRole.PRINCIPAL && targetMembership.role === PlatformRole.SCHOOL_ADMIN) {
        throw new AppError('Principals cannot reset passwords for School Administrators.', 403, 'FORBIDDEN_OPERATION');
      }
    } else if (targetSchoolId) {
      const match = user.memberships.find((m) => m.schoolId === targetSchoolId);
      if (match) targetMembership = match;
    }

    const rawPassword = params.temporaryPassword?.trim() || this.generateSecureTemporaryPassword();
    this.validatePasswordStrength(rawPassword);
    const newPasswordHash = await hashPassword(rawPassword);

    const actingDbUser = params.actingUserId
      ? await prisma.user.findFirst({
          where: {
            OR: [
              { id: params.actingUserId },
              { email: params.actingUserId },
            ],
          },
        })
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: params.mustChangePassword !== false,
          passwordResetAt: new Date(),
          accountLocked: false,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          tokenVersion: { increment: 1 },
        },
      });

      // Revoke any pending self-service password reset tokens
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Record audit log without plaintext password
      await tx.auditLog.create({
        data: {
          schoolId: targetSchoolId || user.memberships[0]?.schoolId || null,
          userId: actingDbUser ? actingDbUser.id : null,
          action: 'ADMIN_PASSWORD_RESET',
          entityType: 'USER_ACCOUNT',
          entityId: user.id,
          details: {
            targetUserEmail: user.email,
            targetRole: targetMembership?.role,
            resetByRole: params.actingUserRole,
            mustChangePassword: params.mustChangePassword !== false,
            reason: params.reason || 'Password reset by administrator',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Password has been reset successfully.',
      temporaryPassword: rawPassword,
      mustChangePassword: params.mustChangePassword !== false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: targetMembership?.role,
      },
    };
  }

  /**
   * Unlocks a locked user account and clears failed login counters
   */
  async adminUnlockAccount(params: {
    schoolId?: string;
    targetUserId: string;
    actingUserId?: string;
    actingUserRole: PlatformRoleType;
    reason?: string;
  }) {
    const school = params.schoolId
      ? await prisma.school.findFirst({
          where: {
            OR: [{ id: params.schoolId }, { slug: params.schoolId }, { code: params.schoolId }],
          },
        })
      : null;
    const targetSchoolId = school ? school.id : params.schoolId;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: params.targetUserId },
          { email: params.targetUserId },
        ],
      },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      throw new AppError('Target user account not found.', 404, 'USER_NOT_FOUND');
    }

    if (params.actingUserRole !== PlatformRole.SUPER_ADMIN) {
      if (!targetSchoolId) {
        throw new AppError('School tenant ID is required.', 400, 'MISSING_SCHOOL_ID');
      }
      const tenantMembership = user.memberships.find((m) => m.schoolId === targetSchoolId);
      if (!tenantMembership) {
        throw new AppError('User not found within your school tenant.', 404, 'USER_NOT_FOUND');
      }
      if (user.memberships.some((m) => m.role === PlatformRole.SUPER_ADMIN)) {
        throw new AppError('School administrators cannot modify platform Super Admin accounts.', 403, 'FORBIDDEN_OPERATION');
      }
    }

    const actingDbUser = params.actingUserId
      ? await prisma.user.findFirst({
          where: {
            OR: [
              { id: params.actingUserId },
              { email: params.actingUserId },
            ],
          },
        })
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          accountLocked: false,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId: targetSchoolId || user.memberships[0]?.schoolId || null,
          userId: actingDbUser ? actingDbUser.id : null,
          action: 'ADMIN_UNLOCK_ACCOUNT',
          entityType: 'USER_ACCOUNT',
          entityId: user.id,
          details: {
            targetUserEmail: user.email,
            unlockedByRole: params.actingUserRole,
            reason: params.reason || 'Account unlocked by administrator',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Account unlocked successfully.',
      user: {
        id: user.id,
        email: user.email,
        accountLocked: false,
      },
    };
  }

  /**
   * Universal Bulk Operations for User Accounts in a School Tenant
   */
  async bulkUserAccountActions(params: {
    schoolId: string;
    userIds: string[];
    action: 'ACTIVATE' | 'DEACTIVATE' | 'UNLOCK' | 'RESET_PASSWORD';
    actingUserId?: string;
    actingUserRole: PlatformRoleType;
    reason?: string;
  }): Promise<BulkActionResponse> {
    const results: BulkItemResult[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const userId of params.userIds) {
      try {
        switch (params.action) {
          case 'ACTIVATE': {
            await this.updateAccountStatus(params.schoolId, userId, true, params.actingUserId || 'admin', params.reason);
            results.push({ id: userId, success: true, message: 'Account activated.' });
            processedCount++;
            break;
          }
          case 'DEACTIVATE': {
            await this.updateAccountStatus(params.schoolId, userId, false, params.actingUserId || 'admin', params.reason);
            results.push({ id: userId, success: true, message: 'Account deactivated.' });
            processedCount++;
            break;
          }
          case 'UNLOCK': {
            await this.adminUnlockAccount({
              schoolId: params.schoolId,
              targetUserId: userId,
              actingUserId: params.actingUserId,
              actingUserRole: params.actingUserRole,
              reason: params.reason,
            });
            results.push({ id: userId, success: true, message: 'Account unlocked.' });
            processedCount++;
            break;
          }
          case 'RESET_PASSWORD': {
            await this.adminResetPassword({
              schoolId: params.schoolId,
              targetUserId: userId,
              mustChangePassword: true,
              actingUserId: params.actingUserId,
              actingUserRole: params.actingUserRole,
              reason: params.reason,
            });
            results.push({
              id: userId,
              success: true,
              message: 'Password reset and temporary password generated.',
            });
            processedCount++;
            break;
          }
          default:
            results.push({ id: userId, success: false, message: `Unsupported action: '${params.action}'.` });
            failedCount++;
        }
      } catch (err: any) {
        results.push({ id: userId, success: false, message: err.message || 'Error processing action.' });
        failedCount++;
      }
    }

    return {
      success: failedCount === 0 || processedCount > 0,
      action: params.action,
      processedCount,
      failedCount,
      totalRequested: params.userIds.length,
      results,
    };
  }

  /**
   * Super Admin lists accounts across all school tenants with cross-tenant search and role filters
   */
  async listSuperAdminAccounts(
    filters: { search?: string; schoolId?: string; role?: string; status?: string; page?: number; limit?: number } = {}
  ) {
    const where: any = {};

    if (filters.schoolId && filters.schoolId !== 'ALL') {
      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: filters.schoolId }, { slug: filters.schoolId }, { code: filters.schoolId }],
        },
      });
      where.schoolId = school ? school.id : filters.schoolId;
    }

    if (filters.role && filters.role !== 'ALL') {
      where.role = filters.role;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
        { school: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.status && filters.status !== 'ALL') {
      const st = filters.status.toUpperCase();
      if (st === 'ACTIVE') {
        where.isActive = true;
        where.user = { isActive: true, accountLocked: false };
      } else if (st === 'INACTIVE') {
        where.OR = [{ isActive: false }, { user: { isActive: false } }];
      } else if (st === 'LOCKED') {
        where.user = { accountLocked: true };
      }
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, memberships] = await Promise.all([
      prisma.userMembership.count({ where }),
      prisma.userMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
              accountLocked: true,
              failedLoginAttempts: true,
              lockoutUntil: true,
              mustChangePassword: true,
              passwordResetAt: true,
              passwordChangedAt: true,
              createdAt: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const users = memberships.map((m) => {
      const isLocked = m.user.accountLocked || Boolean(m.user.lockoutUntil && new Date() < m.user.lockoutUntil);
      return {
        id: m.user.id,
        membershipId: m.id,
        schoolId: m.schoolId,
        schoolName: m.school?.name,
        schoolSlug: m.school?.slug,
        schoolStatus: m.school?.status,
        email: m.user.email,
        username: m.user.username,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        phone: m.user.phone,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        isActive: m.isActive && m.user.isActive,
        accountLocked: isLocked,
        failedLoginAttempts: m.user.failedLoginAttempts,
        lockoutUntil: m.user.lockoutUntil,
        mustChangePassword: m.user.mustChangePassword,
        passwordResetAt: m.user.passwordResetAt,
        passwordChangedAt: m.user.passwordChangedAt,
        createdAt: m.user.createdAt,
      };
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const accountProvisioningService = new AccountProvisioningService();

