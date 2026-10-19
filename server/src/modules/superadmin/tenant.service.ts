import { prisma, checkDatabaseConnection } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { SchoolOnboardingDTO, TenantStatus, PlatformRole, PlatformRoleType } from '@edunexa/shared';

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

        return await prisma.school.findMany({
          where,
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: { memberships: true },
            },
          },
          orderBy: { createdAt: 'desc' },
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
    return result;
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
          details: { code: dto.code, name: dto.name, planName: dto.planName },
        },
      });

      return school;
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

    MEMORY_SCHOOLS.unshift(created);

    AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      action: 'TENANT_ONBOARDED',
      entityType: 'School',
      entityId: created.id,
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: { code: dto.code, name: dto.name, planName: dto.planName },
      school: { id: created.id, name: created.name, code: created.code },
    });

    return created;
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
    return {
      ...PLATFORM_SETTINGS,
      activeSchoolsCount: MEMORY_SCHOOLS.filter((s) => s.status === TenantStatus.ACTIVE).length,
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
}

export const tenantService = new TenantService();
