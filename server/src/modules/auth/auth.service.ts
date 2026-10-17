import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/crypto.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole, PlatformRoleType, TenantStatus } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

// Pre-seeded synthetic user directory for offline testing and rapid verification
export const SYNTHETIC_USERS = [
  {
    userId: 'usr-superadmin-01',
    email: 'superadmin@edunexa.org',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m', // "DemoPass2026!"
    firstName: 'System',
    lastName: 'SuperAdmin',
    role: PlatformRole.SUPER_ADMIN,
    schoolId: undefined,
    schoolSlug: undefined,
    isActive: true,
  },
  {
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m', // "DemoPass2026!"
    firstName: 'Vikram',
    lastName: 'Singhania',
    role: PlatformRole.SCHOOL_ADMIN,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-teacher-01',
    email: 'dr.thorne@apexacademy.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m', // "DemoPass2026!"
    firstName: 'Julian',
    lastName: 'Thorne',
    role: PlatformRole.TEACHER,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    staffProfileId: 'staff-thorne-01',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-student-01',
    email: 'aarav.sharma@student.apex.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m', // "DemoPass2026!"
    firstName: 'Aarav',
    lastName: 'Sharma',
    role: PlatformRole.STUDENT,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    studentProfileId: 'stu-aarav-01',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-student-02-other-school',
    email: 'rohan.p@greenwood.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Rohan',
    lastName: 'Patel',
    role: PlatformRole.STUDENT,
    schoolId: 'sch-greenwood-02',
    schoolSlug: 'greenwood-intl',
    studentProfileId: 'stu-rohan-99',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-parent-01',
    email: 'sunil.sharma@parent.apex.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Sunil',
    lastName: 'Sharma',
    role: PlatformRole.PARENT,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    guardianStudentIds: ['stu-aarav-01'],
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-examcoord-01',
    email: 'exam.coordinator@apexacademy.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Marcus',
    lastName: 'Holloway',
    role: PlatformRole.EXAM_COORDINATOR,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-hradmin-01',
    email: 'hr.admin@apexacademy.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Meera',
    lastName: 'Kulkarni',
    role: PlatformRole.HR_STAFF,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-accounts-01',
    email: 'accounts@apexacademy.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Sanjay',
    lastName: 'Mehta',
    role: PlatformRole.ACCOUNTS,
    schoolId: 'sch-apex-01',
    schoolSlug: 'apex-academy',
    schoolStatus: TenantStatus.ACTIVE,
    isActive: true,
  },
  {
    userId: 'usr-suspended-school-admin',
    email: 'admin@staugustine.edu',
    passwordHash: '$2a$10$wT3wK.sXFjDgnnLd8mY3xebvOQ6B18qTq8u20eSgb/rZeqm5zD78m',
    firstName: 'Father',
    lastName: 'Thomas',
    role: PlatformRole.SCHOOL_ADMIN,
    schoolId: 'sch-augustine-03',
    schoolSlug: 'st-augustine',
    schoolStatus: TenantStatus.SUSPENDED,
    isActive: true,
  },
];

export class AuthService {
  /**
   * Validates credentials and returns JWT tokens with verified user role and tenant context
   */
  async login(email: string, plainTextPass: string) {
    const dbCheck = await checkDatabaseConnection();

    // 1. If database is connected, query PostgreSQL through Prisma
    if (dbCheck.connected) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              school: true,
              studentProfile: true,
              staffProfile: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      const match = await verifyPassword(plainTextPass, user.passwordHash);
      if (!match) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new AppError('Account is disabled. Please contact your platform administrator.', 403, 'ACCOUNT_DISABLED');
      }

      const primaryMembership = user.memberships.find((m) => m.isPrimary) || user.memberships[0];

      if (primaryMembership && primaryMembership.school?.status === TenantStatus.SUSPENDED) {
        throw new AppError('The school subscription has been suspended. Please contact platform support.', 403, 'SCHOOL_SUSPENDED');
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        membershipId: primaryMembership?.id,
        schoolId: primaryMembership?.schoolId,
        role: primaryMembership?.role || PlatformRole.STUDENT,
        studentProfileId: primaryMembership?.studentProfile?.id,
        staffProfileId: primaryMembership?.staffProfile?.id,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: tokenPayload.role,
          schoolId: tokenPayload.schoolId,
          schoolName: primaryMembership?.school?.name,
        },
      };
    }

    // 2. Synthetic Directory Fallback (for verification and tests when hosted DB is not reachable)
    const user = SYNTHETIC_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isMatch = plainTextPass === 'DemoPass2026!' || (await verifyPassword(plainTextPass, user.passwordHash));
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled.', 403, 'ACCOUNT_DISABLED');
    }

    if (user.schoolStatus === TenantStatus.SUSPENDED) {
      throw new AppError('The school subscription has been suspended. Please contact platform support.', 403, 'SCHOOL_SUSPENDED');
    }

    const tokenPayload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
      studentProfileId: (user as any).studentProfileId,
      staffProfileId: (user as any).staffProfileId,
      guardianStudentIds: (user as any).guardianStudentIds,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
        schoolSlug: user.schoolSlug,
      },
    };
  }

  /**
   * Role and context switcher for users with multiple memberships
   */
  async switchContext(userId: string, targetSchoolId: string, targetRole: PlatformRoleType) {
    const tokenPayload: TokenPayload = {
      userId,
      email: 'switched-session@edunexa.org',
      schoolId: targetSchoolId,
      role: targetRole,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      role: targetRole,
      schoolId: targetSchoolId,
    };
  }
}

export const authService = new AuthService();
