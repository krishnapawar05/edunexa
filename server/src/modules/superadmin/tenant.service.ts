import { prisma, checkDatabaseConnection } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { SchoolOnboardingDTO, TenantStatus, PlatformRole, PlatformRoleType } from '@edunexa/shared';

// Synthetic state store for testing and isolation validation
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
}> = [];

export class TenantService {
  async listSchools() {
    const dbCheck = await checkDatabaseConnection();
    if (dbCheck.connected) {
      return prisma.school.findMany({
        include: {
          subscriptions: true,
          _count: {
            select: { memberships: true },
          },
        },
      });
    }
    return MEMORY_SCHOOLS;
  }

  async onboardSchool(dto: SchoolOnboardingDTO, adminUserId: string) {
    const dbCheck = await checkDatabaseConnection();
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (dbCheck.connected) {
      const existing = await prisma.school.findFirst({
        where: { OR: [{ code: dto.code }, { slug }] },
      });
      if (existing) {
        throw new AppError(`A school with code '${dto.code}' or slug '${slug}' already exists.`, 409, 'DUPLICATE_SCHOOL');
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
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          schoolId: school.id,
          userId: adminUserId,
          action: 'TENANT_ONBOARDED',
          entityType: 'School',
          entityId: school.id,
          details: { code: dto.code, name: dto.name },
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
    };

    MEMORY_SCHOOLS.push(created);

    AUDIT_LOGS.push({
      id: `audit-${Date.now()}`,
      action: 'TENANT_ONBOARDED',
      entityType: 'School',
      entityId: created.id,
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: { code: dto.code, name: dto.name },
    });

    return created;
  }

  async updateSchoolStatus(schoolId: string, status: typeof TenantStatus[keyof typeof TenantStatus], adminUserId: string) {
    const school = MEMORY_SCHOOLS.find((s) => s.id === schoolId);
    if (!school) {
      throw new AppError(`School with id '${schoolId}' not found.`, 404, 'SCHOOL_NOT_FOUND');
    }

    school.status = status;

    AUDIT_LOGS.push({
      id: `audit-${Date.now()}`,
      action: 'TENANT_STATUS_UPDATED',
      entityType: 'School',
      entityId: schoolId,
      performedByUserId: adminUserId,
      timestamp: new Date().toISOString(),
      details: { newStatus: status },
    });

    return school;
  }

  async assignUserRole(targetUserId: string, schoolId: string, newRole: PlatformRoleType, performedByUserId: string) {
    // Audited approach to role and permission changes
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

  getAuditLogs() {
    return AUDIT_LOGS;
  }
}

export const tenantService = new TenantService();
