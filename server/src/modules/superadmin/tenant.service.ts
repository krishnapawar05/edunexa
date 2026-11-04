import crypto from 'crypto';
import { prisma, checkDatabaseConnection } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  SchoolOnboardingDTO,
  TenantStatus,
  PlatformRole,
  PlatformRoleType,
  BulkActionResponse,
  BulkItemResult,
  SendSchoolAdminInvitationDTO,
} from '@edunexa/shared';
import { accountProvisioningService } from '../core/provisioning.service.js';

interface MemorySchoolAdminInvitation {
  id: string;
  schoolId: string;
  userId: string;
  email: string;
  recipientName: string;
  role: string;
  tokenHash: string;
  rawToken?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED' | 'FAILED';
  expiresAt: string;
  acceptedAt?: string | null;
  sentAt?: string | null;
  deliveryStatus?: string;
  deliveryError?: string | null;
  invitedByUserId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
}

let MEMORY_INVITATIONS: MemorySchoolAdminInvitation[] = [
  {
    id: 'inv-apex-admin',
    schoolId: 'sch-apex-01',
    userId: 'usr-schooladmin-01',
    email: 'admin@apexacademy.edu',
    recipientName: 'Dr. Ramesh Sharma',
    role: 'SCHOOL_ADMIN',
    tokenHash: 'hash-apex-01',
    status: 'ACCEPTED',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    acceptedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 31 * 86400000).toISOString(),
    deliveryStatus: 'DELIVERED',
    user: {
      id: 'usr-schooladmin-01',
      firstName: 'Dr. Ramesh',
      lastName: 'Sharma',
      email: 'admin@apexacademy.edu',
      isActive: true,
    },
  },
  {
    id: 'inv-greenwood-admin',
    schoolId: 'sch-greenwood-02',
    userId: 'usr-schooladmin-02',
    email: 'contact@greenwood.edu',
    recipientName: 'Sarah Jenkins',
    role: 'SCHOOL_ADMIN',
    tokenHash: 'hash-greenwood-02',
    status: 'ACCEPTED',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    acceptedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    deliveryStatus: 'DELIVERED',
    user: {
      id: 'usr-schooladmin-02',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'contact@greenwood.edu',
      isActive: true,
    },
  },
  {
    id: 'inv-augustine-admin',
    schoolId: 'sch-augustine-03',
    userId: 'usr-schooladmin-03',
    email: 'office@staugustine.edu',
    recipientName: 'Father Michael',
    role: 'SCHOOL_ADMIN',
    tokenHash: 'hash-augustine-03',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    acceptedAt: null,
    sentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    deliveryStatus: 'SENT',
    user: {
      id: 'usr-schooladmin-03',
      firstName: 'Father',
      lastName: 'Michael',
      email: 'office@staugustine.edu',
      isActive: false,
    },
  },
];

// Persistent memory state store for test environments or offline database fallbacks
let MEMORY_SCHOOLS: Array<{
  id: string;
  slug: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: any;
  createdAt: string;
  subscriptions?: any[];
  _count?: { memberships: number };
}> = [
  {
    id: 'sch-apex-01',
    slug: 'apex-academy',
    name: 'Apex Academy of Sciences & Arts',
    code: 'APX-01',
    email: 'admin@apexacademy.edu',
    phone: '+91 80 4123 9000',
    address: '42 Knowledge Way',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560100',
    country: 'India',
    status: TenantStatus.ACTIVE,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    subscriptions: [
      {
        id: 'sub-apex-01',
        planName: 'Enterprise',
        status: TenantStatus.ACTIVE,
        maxStudents: 1500,
        maxStaff: 120,
        billingCycle: 'ANNUAL',
        startDate: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 305 * 24 * 3600 * 1000).toISOString(),
        isSimulated: true,
      },
    ],
    _count: { memberships: 42 },
  },
  {
    id: 'sch-greenwood-02',
    slug: 'greenwood-intl',
    name: 'Greenwood International School',
    code: 'GWH-02',
    email: 'contact@greenwood.edu',
    phone: '+91 20 2567 1100',
    address: '15 University Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411007',
    country: 'India',
    status: TenantStatus.ACTIVE,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    subscriptions: [
      {
        id: 'sub-greenwood-02',
        planName: 'Pro Plan',
        status: TenantStatus.ACTIVE,
        maxStudents: 800,
        maxStaff: 75,
        billingCycle: 'ANNUAL',
        startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 335 * 24 * 3600 * 1000).toISOString(),
        isSimulated: true,
      },
    ],
    _count: { memberships: 28 },
  },
  {
    id: 'sch-augustine-03',
    slug: 'st-augustine',
    name: 'St. Augustine Collegiate',
    code: 'SAC-03',
    email: 'office@staugustine.edu',
    phone: '+91 33 2289 4400',
    address: '8 Park Street',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700016',
    country: 'India',
    status: TenantStatus.SUSPENDED,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    subscriptions: [
      {
        id: 'sub-augustine-03',
        planName: 'Standard',
        status: TenantStatus.SUSPENDED,
        maxStudents: 400,
        maxStaff: 30,
        billingCycle: 'SEMESTER',
        startDate: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        isSimulated: true,
      },
    ],
    _count: { memberships: 14 },
  },
];

let AUDIT_LOGS: Array<{
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedByUserId?: string;
  timestamp: string;
  details: any;
  school?: { id: string; name: string; code: string };
  user?: { id: string; email: string; firstName: string; lastName: string };
}> = [
  {
    id: 'audit-init-01',
    action: 'TENANT_ONBOARDED',
    entityType: 'School',
    entityId: 'sch-apex-01',
    performedByUserId: 'usr-superadmin-01',
    timestamp: new Date(Date.now() - 86400 * 1000).toISOString(),
    details: { code: 'APX-01', name: 'Apex Academy of Sciences & Arts' },
    school: { id: 'sch-apex-01', name: 'Apex Academy of Sciences & Arts', code: 'APX-01' },
    user: { id: 'usr-superadmin-01', email: 'superadmin@edunexa.org', firstName: 'Super', lastName: 'Admin' },
  },
  {
    id: 'audit-init-02',
    action: 'TENANT_STATUS_UPDATED',
    entityType: 'School',
    entityId: 'sch-augustine-03',
    performedByUserId: 'usr-superadmin-01',
    timestamp: new Date(Date.now() - 43200 * 1000).toISOString(),
    details: { newStatus: 'SUSPENDED', reason: 'Administrative audit review pending' },
    school: { id: 'sch-augustine-03', name: 'St. Augustine Collegiate', code: 'SAC-03' },
    user: { id: 'usr-superadmin-01', email: 'superadmin@edunexa.org', firstName: 'Super', lastName: 'Admin' },
  },
];

let PLATFORM_SETTINGS: Record<string, any> = {
  platformName: 'EduNexa Multi-Tenant School ERP',
  supportEmail: 'support@edunexa.org',
  supportPhone: '+91 (11) 2840-9100',
  defaultTimezone: 'Asia/Kolkata',
  maintenanceMode: false,
  broadcastBanner: '',
  sessionTimeoutMinutes: 120,
  maxFailedLogins: 5,
  enforceStrongPassword: true,
  emailNotificationsEnabled: true,
  auditRetentionDays: 365,
};

export class TenantService {
  async getTelemetry() {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const [
          totalSchools,
          activeSchools,
          suspendedSchools,
          pendingSchools,
          totalMemberships,
          totalStudents,
          totalStaff,
          recentLogs,
          subscriptions,
        ] = await Promise.all([
          prisma.school.count(),
          prisma.school.count({ where: { status: TenantStatus.ACTIVE } }),
          prisma.school.count({ where: { status: TenantStatus.SUSPENDED } }),
          prisma.school.count({ where: { status: TenantStatus.PENDING_APPROVAL } }),
          prisma.userMembership.count(),
          prisma.studentProfile.count(),
          prisma.staffProfile.count(),
          prisma.auditLog.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
              school: { select: { id: true, name: true, code: true } },
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          }),
          prisma.subscription.findMany({
            include: {
              school: { select: { id: true, name: true, code: true } },
            },
          }),
        ]);

        const planMap: Record<string, number> = {};
        subscriptions.forEach((s) => {
          planMap[s.planName] = (planMap[s.planName] || 0) + 1;
        });

        return {
          totalSchools,
          activeSchools,
          suspendedSchools,
          pendingSchools,
          totalMemberships,
          totalStudents,
          totalStaff,
          totalSubscriptions: subscriptions.length,
          planBreakdown: Object.entries(planMap).map(([planName, count]) => ({ planName, count })),
          recentAuditLogs: recentLogs.map((l) => ({
            id: l.id,
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId || '',
            performedByUserId: l.userId || 'system',
            timestamp: l.createdAt.toISOString(),
            details: l.details,
            school: l.school,
            user: l.user,
          })),
          systemHealth: {
            databaseConnected: true,
            databaseLatencyMs: dbCheck.latencyMs || 5,
            uptimeSeconds: Math.floor(process.uptime()),
          },
        };
      } catch (err) {
        console.warn('Database query error during telemetry aggregation, using memory fallback:', err);
      }
    }

    // Memory fallback
    const totalSchools = MEMORY_SCHOOLS.length;
    const activeSchools = MEMORY_SCHOOLS.filter((s) => s.status === TenantStatus.ACTIVE).length;
    const suspendedSchools = MEMORY_SCHOOLS.filter((s) => s.status === TenantStatus.SUSPENDED).length;
    const pendingSchools = MEMORY_SCHOOLS.filter((s) => s.status === TenantStatus.PENDING_APPROVAL).length;
    const totalMemberships = MEMORY_SCHOOLS.reduce((acc, s) => acc + (s._count?.memberships || 0), 0);

    return {
      totalSchools,
      activeSchools,
      suspendedSchools,
      pendingSchools,
      totalMemberships,
      totalStudents: 1240,
      totalStaff: 94,
      totalSubscriptions: MEMORY_SCHOOLS.length,
      planBreakdown: [
        { planName: 'Enterprise', count: 1 },
        { planName: 'Pro Plan', count: 1 },
        { planName: 'Standard', count: 1 },
      ],
      recentAuditLogs: AUDIT_LOGS.slice(0, 8),
      systemHealth: {
        databaseConnected: dbCheck.connected,
        databaseLatencyMs: dbCheck.latencyMs || 8,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }

  async listSchools(filters?: { query?: string; status?: string }) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const where: any = {};
        if (filters?.status && filters.status !== 'ALL') {
          where.status = filters.status;
        }
        if (filters?.query) {
          const q = filters.query.trim();
          where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
          ];
        }

        const schools = await prisma.school.findMany({
          where,
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: { memberships: true },
            },
            invitations: {
              where: { role: 'SCHOOL_ADMIN' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
                },
              },
            },
            memberships: {
              where: { role: 'SCHOOL_ADMIN' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return schools.map((school) => {
          const latestMembership = school.memberships?.[0];
          const latestInvitation = school.invitations?.[0];

          let schoolAdmin: any = null;
          let invitationStatus = 'NOT_INVITED';

          if (latestMembership?.user) {
            schoolAdmin = {
              id: latestMembership.user.id,
              name: `${latestMembership.user.firstName} ${latestMembership.user.lastName}`.trim(),
              email: latestMembership.user.email,
              isActive: latestMembership.user.isActive,
            };
          } else if (latestInvitation?.user) {
            schoolAdmin = {
              id: latestInvitation.user.id,
              name: `${latestInvitation.user.firstName} ${latestInvitation.user.lastName}`.trim(),
              email: latestInvitation.email || latestInvitation.user.email,
              isActive: latestInvitation.user.isActive,
            };
          }

          if (latestInvitation) {
            schoolAdmin = {
              ...(schoolAdmin || {}),
              invitationId: latestInvitation.id,
              invitationStatus: latestInvitation.status,
              expiresAt: latestInvitation.expiresAt,
              sentAt: latestInvitation.sentAt,
              deliveryStatus: latestInvitation.deliveryStatus,
            };
            invitationStatus = latestInvitation.status;
            if (latestMembership?.user?.isActive && latestInvitation.status !== 'REVOKED') {
              invitationStatus = 'ACCEPTED';
            }
          } else if (latestMembership?.user?.isActive) {
            invitationStatus = 'ACCEPTED';
          }

          return {
            ...school,
            schoolAdmin,
            invitationStatus,
          };
        });
      } catch (err) {
        console.warn('Prisma listSchools error, using memory fallback:', err);
      }
    }

    let result = [...MEMORY_SCHOOLS];
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((s) => s.status === filters.status);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }
    return result.map((s) => {
      const inv = MEMORY_INVITATIONS.find((i) => i.schoolId === s.id && i.role === 'SCHOOL_ADMIN');
      return {
        ...s,
        schoolAdmin: inv
          ? {
              id: inv.userId,
              name: inv.recipientName,
              email: inv.email,
              isActive: inv.status === 'ACCEPTED',
              invitationId: inv.id,
              invitationStatus: inv.status,
              expiresAt: inv.expiresAt,
              sentAt: inv.sentAt,
              deliveryStatus: inv.deliveryStatus,
            }
          : null,
        invitationStatus: inv ? inv.status : 'NOT_INVITED',
      };
    });
  }

  async onboardSchool(dto: SchoolOnboardingDTO, adminUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    const baseSlug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;

    if (dbCheck.connected) {
      const existingByCode = await prisma.school.findFirst({
        where: { code: dto.code },
      });
      if (existingByCode) {
        throw new AppError(`A school with code '${dto.code}' already exists.`, 409, 'DUPLICATE_SCHOOL');
      }

      const existingBySlug = await prisma.school.findFirst({
        where: { slug },
      });
      if (existingBySlug) {
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      const cleanAdminEmail = dto.adminEmail ? dto.adminEmail.trim().toLowerCase() : null;

      const school = await prisma.school.create({
        data: {
          name: dto.name,
          code: dto.code,
          slug,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country || 'India',
          websiteUrl: dto.websiteUrl,
          status: TenantStatus.ACTIVE,
          subscriptions: {
            create: {
              planName: dto.planName,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: TenantStatus.ACTIVE,
              maxStudents: dto.planName === 'Enterprise' ? 2500 : dto.planName === 'Pro' ? 1000 : 500,
              maxStaff: dto.planName === 'Enterprise' ? 200 : dto.planName === 'Pro' ? 100 : 50,
            },
          },
        },
        include: {
          subscriptions: true,
          _count: { select: { memberships: true } },
        },
      });

      let adminProvisionResult: any = null;

      if (cleanAdminEmail) {
        // Prevent duplicate School Admin accounts for the same email and tenant
        const existingAdmin = await prisma.userMembership.findFirst({
          where: {
            schoolId: school.id,
            role: 'SCHOOL_ADMIN',
            user: { email: cleanAdminEmail },
          },
        });

        if (existingAdmin) {
          throw new AppError(
            `A School Admin account with email '${cleanAdminEmail}' already exists for this tenant.`,
            409,
            'DUPLICATE_SCHOOL_ADMIN'
          );
        }

        const nameParts = (dto.adminFullName || 'School Administrator').trim().split(/\s+/);
        const firstName = nameParts[0] || 'School';
        const lastName = nameParts.slice(1).join(' ') || 'Admin';

        adminProvisionResult = await accountProvisioningService.provisionAccount(prisma, {
          schoolId: school.id,
          email: cleanAdminEmail,
          firstName,
          lastName,
          phone: dto.adminPhone || dto.phone,
          role: PlatformRole.SCHOOL_ADMIN,
          actingUserRole: PlatformRole.SUPER_ADMIN,
          actingUserId: adminUserId,
          sendInvitation: dto.sendInvitation !== false,
          schoolName: school.name,
        });
      }

      let validUserId: string | undefined = undefined;
      if (adminUserId) {
        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
        if (adminUser) validUserId = adminUser.id;
      }

      await prisma.auditLog.create({
        data: {
          schoolId: school.id,
          userId: validUserId,
          action: 'TENANT_ONBOARDED',
          entityType: 'School',
          entityId: school.id,
          details: {
            code: dto.code,
            name: dto.name,
            planName: dto.planName,
            schoolAdminEmail: cleanAdminEmail,
            invitationIssued: Boolean(adminProvisionResult?.invitation),
          },
        },
      });

      return {
        ...school,
        schoolAdmin: adminProvisionResult?.user
          ? {
              ...adminProvisionResult.user,
              invitation: adminProvisionResult.invitation,
              accountStatus: 'PENDING_ACTIVATION',
              rawActivationToken: adminProvisionResult.rawActivationToken,
            }
          : null,
        invitationStatus: adminProvisionResult?.invitation ? 'SENT' : 'NOT_INVITED',
      };
    }

    // Memory Fallback
    const existingMem = MEMORY_SCHOOLS.find((s) => s.code === dto.code || s.slug === slug);
    if (existingMem) {
      throw new AppError(`A school with code '${dto.code}' already exists.`, 409, 'DUPLICATE_SCHOOL');
    }

    const created = {
      id: `sch-${Date.now()}`,
      slug,
      name: dto.name,
      code: dto.code,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country || 'India',
      status: TenantStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      subscriptions: [
        {
          id: `sub-${Date.now()}`,
          planName: dto.planName,
          status: TenantStatus.ACTIVE,
          maxStudents: dto.planName === 'Enterprise' ? 2500 : 800,
          maxStaff: 80,
          billingCycle: 'ANNUAL',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          isSimulated: true,
        },
      ],
      _count: { memberships: 0 },
    };

    let memoryAdminUser: any = null;
    let memoryInvitation: any = null;

    if (dto.adminEmail && dto.adminEmail.trim()) {
      const cleanEmail = dto.adminEmail.trim().toLowerCase();
      const existingAdminMem = MEMORY_INVITATIONS.find(
        (i) => i.schoolId === created.id && i.email === cleanEmail && i.role === 'SCHOOL_ADMIN'
      );
      if (existingAdminMem) {
        throw new AppError(
          `A School Admin account with email '${cleanEmail}' already exists for this tenant.`,
          409,
          'DUPLICATE_SCHOOL_ADMIN'
        );
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

      memoryAdminUser = {
        id: `usr-admin-${Date.now()}`,
        firstName: dto.adminFullName ? dto.adminFullName.split(' ')[0] : 'School',
        lastName: dto.adminFullName ? dto.adminFullName.split(' ').slice(1).join(' ') || 'Admin' : 'Admin',
        email: cleanEmail,
        phone: dto.adminPhone || dto.phone,
        isActive: false,
      };

      memoryInvitation = {
        id: `inv-${Date.now()}`,
        schoolId: created.id,
        userId: memoryAdminUser.id,
        email: cleanEmail,
        recipientName: dto.adminFullName || `${memoryAdminUser.firstName} ${memoryAdminUser.lastName}`,
        role: 'SCHOOL_ADMIN',
        tokenHash,
        rawToken,
        status: 'PENDING',
        expiresAt,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'SENT',
        invitedByUserId: adminUserId,
        user: memoryAdminUser,
      };

      MEMORY_INVITATIONS.unshift(memoryInvitation);
      created._count.memberships = 1;
    }

    MEMORY_SCHOOLS.unshift(created);

    AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      action: 'TENANT_ONBOARDED',
      entityType: 'School',
      entityId: created.id,
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: {
        code: dto.code,
        name: dto.name,
        planName: dto.planName,
        schoolAdminEmail: dto.adminEmail,
      },
      school: { id: created.id, name: created.name, code: created.code },
    });

    return {
      ...created,
      schoolAdmin: memoryAdminUser
        ? {
            ...memoryAdminUser,
            invitation: memoryInvitation,
            accountStatus: 'PENDING_ACTIVATION',
            rawActivationToken: memoryInvitation.rawToken,
          }
        : null,
      invitationStatus: memoryInvitation ? 'SENT' : 'NOT_INVITED',
    };
  }

  async listSchoolInvitations(schoolId: string) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const invitations = await prisma.accountInvitation.findMany({
          where: {
            schoolId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return invitations.map((inv) => {
          let computedStatus = inv.status;
          if (computedStatus === 'PENDING' && new Date() > inv.expiresAt) {
            computedStatus = 'EXPIRED';
          }

          return {
            id: inv.id,
            schoolId: inv.schoolId,
            schoolName: inv.school.name,
            userId: inv.userId,
            email: inv.email || inv.user.email,
            recipientName: `${inv.user.firstName} ${inv.user.lastName}`.trim(),
            role: inv.role,
            status: computedStatus,
            accountStatus: inv.user.isActive ? 'ACTIVE' : 'PENDING_ACTIVATION',
            expiresAt: inv.expiresAt,
            sentAt: inv.sentAt,
            acceptedAt: inv.acceptedAt,
            deliveryStatus: inv.deliveryStatus || 'SENT',
            deliveryError: inv.deliveryError,
            userIsActive: inv.user.isActive,
          };
        });
      } catch (err) {
        console.warn('Prisma listSchoolInvitations error, using memory fallback:', err);
      }
    }

    return MEMORY_INVITATIONS.filter((inv) => inv.schoolId === schoolId);
  }

  async sendSchoolAdminInvitation(schoolId: string, dto: SendSchoolAdminInvitationDTO, actingUserId: string) {
    const cleanEmail = dto.adminEmail.trim().toLowerCase();
    const dbCheck = await checkDatabaseConnection();

    if (dbCheck.connected) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });
      if (!school) {
        throw new AppError(`School tenant '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
      }

      // Prevent duplicate School Admin accounts for the same email and tenant
      const existingMembership = await prisma.userMembership.findFirst({
        where: {
          schoolId,
          role: 'SCHOOL_ADMIN',
          user: { email: cleanEmail },
        },
        include: { user: true },
      });

      if (existingMembership) {
        if (existingMembership.isActive) {
          throw new AppError(
            `A School Admin account with email '${cleanEmail}' is already active for this school.`,
            409,
            'DUPLICATE_SCHOOL_ADMIN'
          );
        }

        // If membership exists but inactive, check existing invitation or issue a fresh one
        const existingInv = await prisma.accountInvitation.findFirst({
          where: {
            schoolId,
            userId: existingMembership.userId,
            role: 'SCHOOL_ADMIN',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingInv && existingInv.status === 'PENDING') {
          return await accountProvisioningService.resendInvitation(schoolId, existingInv.id, actingUserId);
        }
      }

      const nameParts = dto.adminFullName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'School';
      const lastName = nameParts.slice(1).join(' ') || 'Admin';

      const provisionResult = await accountProvisioningService.provisionAccount(prisma, {
        schoolId,
        email: cleanEmail,
        firstName,
        lastName,
        phone: dto.adminPhone,
        role: PlatformRole.SCHOOL_ADMIN,
        actingUserRole: PlatformRole.SUPER_ADMIN,
        actingUserId,
        sendInvitation: dto.sendInvitation !== false,
        schoolName: school.name,
      });

      return {
        success: true,
        user: provisionResult.user,
        invitation: provisionResult.invitation,
        rawActivationToken: process.env.NODE_ENV !== 'production' ? provisionResult.rawActivationToken : undefined,
      };
    }

    // Memory Fallback
    const school = MEMORY_SCHOOLS.find((s) => s.id === schoolId);
    if (!school) {
      throw new AppError(`School tenant '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
    }

    const existingMem = MEMORY_INVITATIONS.find(
      (i) => i.schoolId === schoolId && i.email === cleanEmail && i.role === 'SCHOOL_ADMIN'
    );
    if (existingMem && existingMem.status === 'ACCEPTED') {
      throw new AppError(
        `A School Admin account with email '${cleanEmail}' is already active for this school.`,
        409,
        'DUPLICATE_SCHOOL_ADMIN'
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    const newInv: MemorySchoolAdminInvitation = {
      id: `inv-${Date.now()}`,
      schoolId,
      userId: `usr-${Date.now()}`,
      email: cleanEmail,
      recipientName: dto.adminFullName.trim(),
      role: 'SCHOOL_ADMIN',
      tokenHash,
      rawToken,
      status: 'PENDING',
      expiresAt,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'SENT',
      invitedByUserId: actingUserId,
      user: {
        id: `usr-${Date.now()}`,
        firstName: dto.adminFullName.split(' ')[0] || 'Admin',
        lastName: dto.adminFullName.split(' ').slice(1).join(' ') || 'User',
        email: cleanEmail,
        isActive: false,
      },
    };

    MEMORY_INVITATIONS.unshift(newInv);

    return {
      success: true,
      user: newInv.user,
      invitation: {
        id: newInv.id,
        status: newInv.status,
        expiresAt: newInv.expiresAt,
        deliveryStatus: newInv.deliveryStatus,
      },
      rawActivationToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resendSchoolAdminInvitation(schoolId: string, invitationId: string, actingUserId: string) {
    if (!invitationId) {
      throw new AppError('Invitation ID is required.', 400, 'MISSING_INVITATION_ID');
    }

    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      return await accountProvisioningService.resendInvitation(schoolId, invitationId, actingUserId);
    }

    // Memory Fallback
    const existing = MEMORY_INVITATIONS.find((i) => i.id === invitationId && i.schoolId === schoolId);
    if (!existing) {
      throw new AppError('Invitation record not found.', 404, 'INVITATION_NOT_FOUND');
    }

    if (existing.status === 'ACCEPTED') {
      throw new AppError('Account is already activated. Cannot resend an accepted invitation.', 400, 'ACCOUNT_ALREADY_ACTIVATED');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    existing.tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    existing.rawToken = rawToken;
    existing.status = 'PENDING';
    existing.expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    existing.sentAt = new Date().toISOString();
    existing.deliveryStatus = 'SENT';

    return {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      status: existing.status,
      expiresAt: existing.expiresAt,
      rawToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async revokeSchoolAdminInvitation(schoolId: string, invitationId: string, actingUserId: string, reason?: string) {
    if (!invitationId) {
      throw new AppError('Invitation ID is required.', 400, 'MISSING_INVITATION_ID');
    }

    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      return await accountProvisioningService.revokeInvitation(schoolId, invitationId, actingUserId, reason);
    }

    // Memory Fallback
    const existing = MEMORY_INVITATIONS.find((i) => i.id === invitationId && i.schoolId === schoolId);
    if (!existing) {
      throw new AppError('Invitation record not found.', 404, 'INVITATION_NOT_FOUND');
    }

    if (existing.status === 'ACCEPTED') {
      throw new AppError('Cannot revoke an invitation that has already been accepted.', 400, 'INVITATION_ALREADY_ACCEPTED');
    }

    existing.status = 'REVOKED';
    return existing;
  }

  async updateSchoolStatus(schoolId: string, status: any, adminUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const school = await prisma.school.update({
          where: { id: schoolId },
          data: { status },
          include: { subscriptions: true },
        });

        let validUserId: string | undefined = undefined;
        if (adminUserId) {
          const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
          if (adminUser) validUserId = adminUser.id;
        }

        await prisma.auditLog.create({
          data: {
            schoolId: school.id,
            userId: validUserId,
            action: 'TENANT_STATUS_UPDATED',
            entityType: 'School',
            entityId: school.id,
            details: { newStatus: status },
          },
        });

        return school;
      } catch (err: any) {
        if (err.code === 'P2025') {
          throw new AppError(`School with id '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
        }
      }
    }

    const school = MEMORY_SCHOOLS.find((s) => s.id === schoolId);
    if (!school) {
      throw new AppError(`School with id '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
    }

    school.status = status;

    AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      action: 'TENANT_STATUS_UPDATED',
      entityType: 'School',
      entityId: schoolId,
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: { newStatus: status },
      school: { id: school.id, name: school.name, code: school.code },
    });

    return school;
  }

  async updateSchool(schoolId: string, dto: any, adminUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const school = await prisma.school.update({
          where: { id: schoolId },
          data: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
            websiteUrl: dto.websiteUrl,
            ...(dto.motto !== undefined ? { motto: dto.motto } : {}),
            ...(dto.code !== undefined ? { code: dto.code } : {}),
            ...(dto.brandingConfig !== undefined ? { brandingConfig: dto.brandingConfig } : {}),
          },
          include: { subscriptions: true },
        });

        let validUserId: string | undefined = undefined;
        if (adminUserId) {
          const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
          if (adminUser) validUserId = adminUser.id;
        }

        await prisma.auditLog.create({
          data: {
            schoolId: school.id,
            userId: validUserId,
            action: 'TENANT_METADATA_UPDATED',
            entityType: 'School',
            entityId: school.id,
            details: dto,
          },
        });

        return school;
      } catch (err: any) {
        if (err.code === 'P2025') {
          throw new AppError(`School with id '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
        }
      }
    }

    const school = MEMORY_SCHOOLS.find((s) => s.id === schoolId);
    if (!school) {
      throw new AppError(`School with id '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
    }

    Object.assign(school, dto);
    return school;
  }

  async listSubscriptions() {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        return await prisma.subscription.findMany({
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        console.warn('Prisma listSubscriptions error, using fallback:', err);
      }
    }

    const subs: any[] = [];
    MEMORY_SCHOOLS.forEach((s) => {
      if (s.subscriptions) {
        s.subscriptions.forEach((sub) => {
          subs.push({
            ...sub,
            schoolId: s.id,
            school: {
              id: s.id,
              name: s.name,
              code: s.code,
              city: s.city,
              status: s.status,
            },
          });
        });
      }
    });
    return subs;
  }

  async updateSubscription(subscriptionId: string, dto: any, adminUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        const updateData: any = {};
        if (dto.planName) updateData.planName = dto.planName;
        if (dto.status) updateData.status = dto.status;
        if (dto.billingCycle) updateData.billingCycle = dto.billingCycle;
        if (dto.maxStudents) updateData.maxStudents = Number(dto.maxStudents);
        if (dto.maxStaff) updateData.maxStaff = Number(dto.maxStaff);
        if (dto.endDate) updateData.endDate = new Date(dto.endDate);

        const sub = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: updateData,
          include: { school: true },
        });

        let validUserId: string | undefined = undefined;
        if (adminUserId) {
          const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
          if (adminUser) validUserId = adminUser.id;
        }

        await prisma.auditLog.create({
          data: {
            schoolId: sub.schoolId,
            userId: validUserId,
            action: 'SUBSCRIPTION_PLAN_MODIFIED',
            entityType: 'Subscription',
            entityId: sub.id,
            details: { planName: sub.planName, status: sub.status, maxStudents: sub.maxStudents },
          },
        });

        return sub;
      } catch (err: any) {
        if (err.code === 'P2025') {
          throw new AppError(`Subscription with id '${subscriptionId}' not found.`, 404, 'SUBSCRIPTION_NOT_FOUND');
        }
      }
    }

    // Memory fallback
    for (const school of MEMORY_SCHOOLS) {
      if (school.subscriptions) {
        const sub = school.subscriptions.find((s) => s.id === subscriptionId);
        if (sub) {
          Object.assign(sub, dto);
          return { ...sub, school };
        }
      }
    }
    throw new AppError(`Subscription with id '${subscriptionId}' not found.`, 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  async getAuditLogs(filters?: { action?: string; schoolId?: string; limit?: number }) {
    if (process.env.NODE_ENV !== 'test') {
      const dbCheck = await checkDatabaseConnection();
      if (dbCheck.connected) {
        try {
          const where: any = {};
          if (filters?.action && filters.action !== 'ALL') {
            where.action = filters.action;
          }
          if (filters?.schoolId && filters.schoolId !== 'ALL') {
            where.schoolId = filters.schoolId;
          }

          const logs = await prisma.auditLog.findMany({
            where,
            take: filters?.limit || 100,
            orderBy: { createdAt: 'desc' },
            include: {
              school: { select: { id: true, name: true, code: true } },
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          });

          if (logs.length > 0) {
            return logs.map((l) => ({
              id: l.id,
              action: l.action,
              entityType: l.entityType,
              entityId: l.entityId || '',
              performedByUserId: l.userId || 'system',
              timestamp: l.createdAt.toISOString(),
              details: l.details,
              school: l.school,
              user: l.user,
            }));
          }
        } catch (err) {
          console.warn('Prisma getAuditLogs error, using fallback:', err);
        }
      }
    }

    let logs = [...AUDIT_LOGS];
    if (filters?.action && filters.action !== 'ALL') {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.schoolId && filters.schoolId !== 'ALL') {
      logs = logs.filter((l) => l.school?.id === filters.schoolId);
    }
    return logs;
  }

  async getSettings() {
    let activeSchoolsCount = 0;
    try {
      activeSchoolsCount = await prisma.school.count({ where: { status: TenantStatus.ACTIVE } });
    } catch {
      activeSchoolsCount = 0;
    }
    return {
      ...PLATFORM_SETTINGS,
      activeSchoolsCount,
      serverTime: new Date().toISOString(),
    };
  }

  async updateSettings(dto: any, adminUserId: string) {
    PLATFORM_SETTINGS = {
      ...PLATFORM_SETTINGS,
      ...dto,
    };

    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        let validUserId: string | undefined = undefined;
        if (adminUserId) {
          const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
          if (adminUser) validUserId = adminUser.id;
        }

        await prisma.auditLog.create({
          data: {
            userId: validUserId,
            action: 'SYSTEM_SETTINGS_UPDATED',
            entityType: 'PlatformConfig',
            entityId: 'global',
            details: dto,
          },
        });
      } catch {
        // non-fatal audit logging
      }
    }

    AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'PlatformConfig',
      entityId: 'global',
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: dto,
    });

    return PLATFORM_SETTINGS;
  }

  async assignUserRole(targetUserId: string, schoolId: string, newRole: PlatformRoleType, performedByUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      try {
        let validUserId: string | undefined = undefined;
        if (performedByUserId) {
          const u = await prisma.user.findUnique({ where: { id: performedByUserId } });
          if (u) validUserId = u.id;
        }

        await prisma.auditLog.create({
          data: {
            schoolId,
            userId: validUserId,
            action: 'ROLE_PERMISSION_CHANGED',
            entityType: 'UserMembership',
            entityId: targetUserId,
            details: { targetUserId, schoolId, newRole },
          },
        });
      } catch (err) {
        console.warn('AuditLog save error in assignUserRole:', err);
      }
    }

    AUDIT_LOGS.push({
      id: `audit-${Date.now()}`,
      action: 'ROLE_PERMISSION_CHANGED',
      entityType: 'UserMembership',
      entityId: targetUserId,
      performedByUserId,
      timestamp: new Date().toISOString(),
      details: { targetUserId, schoolId, newRole },
    });

    return {
      userId: targetUserId,
      schoolId,
      role: newRole,
      assignedAt: new Date().toISOString(),
    };
  }

  async bulkSchoolActions(
    action: string,
    schoolIds: string[],
    adminUserId: string
  ): Promise<BulkActionResponse> {
    const results: BulkItemResult[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const schoolId of schoolIds) {
      try {
        if (action.toUpperCase() === 'ACTIVATE') {
          await this.updateSchoolStatus(schoolId, 'ACTIVE', adminUserId);
          results.push({ id: schoolId, success: true, message: 'School activated.' });
          processedCount++;
        } else if (action.toUpperCase() === 'SUSPEND') {
          await this.updateSchoolStatus(schoolId, 'SUSPENDED', adminUserId);
          results.push({ id: schoolId, success: true, message: 'School suspended.' });
          processedCount++;
        } else if (action.toUpperCase() === 'REVIEW') {
          const school = await prisma.school.findFirst({
            where: { OR: [{ id: schoolId }, { slug: schoolId }, { code: schoolId }] },
          });
          const targetSchoolId = school ? school.id : schoolId;

          let validUserId: string | null = null;
          if (adminUserId) {
            const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
            if (adminUser) validUserId = adminUser.id;
          }

          try {
            await prisma.auditLog.create({
              data: {
                schoolId: targetSchoolId,
                userId: validUserId,
                action: 'TENANT_BULK_REVIEW',
                entityType: 'School',
                entityId: targetSchoolId,
                details: { reviewedAt: new Date().toISOString() },
              },
            });
          } catch (auditErr) {
            console.warn('[TenantService] Audit log creation non-fatal error:', auditErr);
          }

          results.push({ id: schoolId, success: true, message: 'School marked as reviewed.' });
          processedCount++;
        } else {
          results.push({ id: schoolId, success: false, message: `Unsupported action: '${action}'.` });
          failedCount++;
        }
      } catch (err: any) {
        results.push({ id: schoolId, success: false, message: err.message || 'Failed to process school.' });
        failedCount++;
      }
    }

    return {
      success: failedCount === 0 || processedCount > 0,
      action,
      processedCount,
      failedCount,
      totalRequested: schoolIds.length,
      results,
    };
  }

  async bulkSubscriptionActions(
    action: string,
    subscriptionIds: string[],
    adminUserId: string
  ): Promise<BulkActionResponse> {
    const results: BulkItemResult[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const subId of subscriptionIds) {
      try {
        if (action.toUpperCase() === 'REVIEW') {
          results.push({ id: subId, success: true, message: 'Subscription reviewed.' });
          processedCount++;
        } else if (action.toUpperCase() === 'EXTEND') {
          const sub = await prisma.subscription.findUnique({ where: { id: subId } });
          if (!sub) {
            results.push({ id: subId, success: false, message: 'Subscription not found.' });
            failedCount++;
            continue;
          }
          const newEndDate = new Date(sub.endDate);
          newEndDate.setDate(newEndDate.getDate() + 30);
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { endDate: newEndDate, status: 'ACTIVE' },
          });
          results.push({ id: subId, success: true, message: 'Subscription extended by 30 days.' });
          processedCount++;
        } else {
          results.push({ id: subId, success: false, message: `Unsupported action: '${action}'.` });
          failedCount++;
        }
      } catch (err: any) {
        results.push({ id: subId, success: false, message: err.message || 'Failed to process subscription.' });
        failedCount++;
      }
    }

    return {
      success: failedCount === 0 || processedCount > 0,
      action,
      processedCount,
      failedCount,
      totalRequested: subscriptionIds.length,
      results,
    };
  }

  /**
   * Super Admin lists accounts across all school tenants
   */
  async listAccounts(filters: { search?: string; schoolId?: string; role?: string; status?: string; page?: number; limit?: number } = {}) {
    return accountProvisioningService.listSuperAdminAccounts(filters);
  }

  /**
   * Super Admin resets any school administrator or user password with direct database persistence
   */
  async resetAccountPassword(params: {
    targetUserId: string;
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    actingUserId?: string;
    reason?: string;
  }) {
    return accountProvisioningService.adminResetPassword({
      targetUserId: params.targetUserId,
      temporaryPassword: params.temporaryPassword,
      mustChangePassword: params.mustChangePassword,
      actingUserId: params.actingUserId,
      actingUserRole: PlatformRole.SUPER_ADMIN,
      reason: params.reason,
    });
  }

  /**
   * Super Admin unlocks any locked account
   */
  async unlockAccount(params: { targetUserId: string; actingUserId?: string; reason?: string }) {
    return accountProvisioningService.adminUnlockAccount({
      targetUserId: params.targetUserId,
      actingUserId: params.actingUserId,
      actingUserRole: PlatformRole.SUPER_ADMIN,
      reason: params.reason,
    });
  }

  /**
   * Super Admin activates or deactivates any account platform-wide
   */
  async updateAccountStatus(params: { targetUserId: string; isActive: boolean; actingUserId?: string; reason?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: params.targetUserId },
      include: { memberships: true },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const primaryMembership = user.memberships[0];

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isActive: params.isActive },
      });

      await tx.userMembership.updateMany({
        where: { userId: user.id },
        data: { isActive: params.isActive },
      });

      const actingDbUser = params.actingUserId
        ? await tx.user.findFirst({
            where: {
              OR: [{ id: params.actingUserId }, { email: params.actingUserId }],
            },
          })
        : null;

      await tx.auditLog.create({
        data: {
          schoolId: primaryMembership?.schoolId || null,
          userId: actingDbUser ? actingDbUser.id : null,
          action: params.isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
          entityType: 'USER_ACCOUNT',
          entityId: user.id,
          details: {
            targetUserEmail: user.email,
            performedByRole: PlatformRole.SUPER_ADMIN,
            reason: params.reason || (params.isActive ? 'Reactivated by Super Admin' : 'Suspended by Super Admin'),
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: `Account has been ${params.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: user.id,
        email: user.email,
        isActive: params.isActive,
      },
    };
  }
}

export const tenantService = new TenantService();
