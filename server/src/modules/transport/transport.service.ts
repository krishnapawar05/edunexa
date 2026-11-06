import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateTransportVehicleDTO,
  CreateTransportDriverDTO,
  CreateTransportRouteDTO,
  AllocateStudentTransportDTO,
} from '@edunexa/shared';

export class TransportService {
  // ==========================================================================
  // 1. VEHICLES
  // ==========================================================================
  async listVehicles(schoolId: string, status?: string) {
    const where: any = { schoolId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    return prisma.transportVehicle.findMany({
      where,
      include: {
        driver: true,
        routes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVehicle(schoolId: string, data: CreateTransportVehicleDTO) {
    const existing = await prisma.transportVehicle.findFirst({
      where: { schoolId, registrationNumber: data.registrationNumber.trim().toUpperCase() },
    });
    if (existing) {
      throw new AppError('A vehicle with this registration number already exists in this school.', 409);
    }

    if (data.driverId) {
      const driver = await prisma.transportDriver.findFirst({
        where: { id: data.driverId, schoolId },
      });
      if (!driver) {
        throw new AppError('Assigned driver does not exist in this school.', 404);
      }
    }

    return prisma.transportVehicle.create({
      data: {
        schoolId,
        registrationNumber: data.registrationNumber.trim().toUpperCase(),
        vehicleModel: data.vehicleModel.trim(),
        capacity: data.capacity || 40,
        driverId: data.driverId || null,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : null,
        status: data.status as any || 'ACTIVE',
      },
      include: { driver: true },
    });
  }

  async updateVehicle(schoolId: string, id: string, data: Partial<CreateTransportVehicleDTO>) {
    const vehicle = await prisma.transportVehicle.findFirst({
      where: { id, schoolId },
    });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    return prisma.transportVehicle.update({
      where: { id },
      data: {
        registrationNumber: data.registrationNumber ? data.registrationNumber.trim().toUpperCase() : undefined,
        vehicleModel: data.vehicleModel ? data.vehicleModel.trim() : undefined,
        capacity: data.capacity,
        driverId: data.driverId !== undefined ? data.driverId : undefined,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : undefined,
        status: data.status as any,
      },
      include: { driver: true },
    });
  }

  async deleteVehicle(schoolId: string, id: string) {
    const vehicle = await prisma.transportVehicle.findFirst({
      where: { id, schoolId },
      include: { routes: true },
    });
    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }
    if (vehicle.routes.length > 0) {
      throw new AppError('Cannot delete vehicle assigned to active transport routes.', 400);
    }

    return prisma.transportVehicle.delete({ where: { id } });
  }

  // ==========================================================================
  // 2. DRIVERS
  // ==========================================================================
  async listDrivers(schoolId: string) {
    return prisma.transportDriver.findMany({
      where: { schoolId },
      include: {
        vehicles: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDriver(schoolId: string, data: CreateTransportDriverDTO) {
    const existing = await prisma.transportDriver.findFirst({
      where: { schoolId, licenseNumber: data.licenseNumber.trim().toUpperCase() },
    });
    if (existing) {
      throw new AppError('A driver with this license number already exists.', 409);
    }

    return prisma.transportDriver.create({
      data: {
        schoolId,
        name: data.name.trim(),
        licenseNumber: data.licenseNumber.trim().toUpperCase(),
        phone: data.phone.trim(),
        emergencyContact: data.emergencyContact ? data.emergencyContact.trim() : null,
        status: data.status as any || 'ACTIVE',
      },
    });
  }

  async updateDriver(schoolId: string, id: string, data: Partial<CreateTransportDriverDTO>) {
    const driver = await prisma.transportDriver.findFirst({
      where: { id, schoolId },
    });
    if (!driver) throw new AppError('Driver not found.', 404);

    return prisma.transportDriver.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        licenseNumber: data.licenseNumber ? data.licenseNumber.trim().toUpperCase() : undefined,
        phone: data.phone ? data.phone.trim() : undefined,
        emergencyContact: data.emergencyContact !== undefined ? data.emergencyContact : undefined,
        status: data.status as any,
      },
    });
  }

  async deleteDriver(schoolId: string, id: string) {
    const driver = await prisma.transportDriver.findFirst({
      where: { id, schoolId },
      include: { vehicles: true },
    });
    if (!driver) throw new AppError('Driver not found.', 404);
    if (driver.vehicles.length > 0) {
      throw new AppError('Cannot delete driver currently assigned to active vehicles.', 400);
    }
    return prisma.transportDriver.delete({ where: { id } });
  }

  // ==========================================================================
  // 3. ROUTES & STOPS
  // ==========================================================================
  async listRoutes(schoolId: string) {
    return prisma.transportRoute.findMany({
      where: { schoolId },
      include: {
        vehicle: { include: { driver: true } },
        stops: { orderBy: { stopOrder: 'asc' } },
        allocations: {
          include: {
            studentProfile: {
              include: {
                membership: { include: { user: true } },
              },
            },
          },
        },
      },
      orderBy: { routeCode: 'asc' },
    });
  }

  async createRoute(schoolId: string, data: CreateTransportRouteDTO) {
    const existing = await prisma.transportRoute.findFirst({
      where: { schoolId, routeCode: data.routeCode.trim().toUpperCase() },
    });
    if (existing) {
      throw new AppError('Route with this route code already exists in this school.', 409);
    }

    if (data.vehicleId) {
      const vehicle = await prisma.transportVehicle.findFirst({
        where: { id: data.vehicleId, schoolId },
      });
      if (!vehicle) throw new AppError('Assigned vehicle not found.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const route = await tx.transportRoute.create({
        data: {
          schoolId,
          routeName: data.routeName.trim(),
          routeCode: data.routeCode.trim().toUpperCase(),
          vehicleId: data.vehicleId || null,
          startLocation: data.startLocation.trim(),
          endLocation: data.endLocation.trim(),
          monthlyFare: data.monthlyFare || 1500,
          status: data.status as any || 'ACTIVE',
        },
      });

      if (data.stops && data.stops.length > 0) {
        await tx.transportRouteStop.createMany({
          data: data.stops.map((s, idx) => ({
            routeId: route.id,
            stopName: s.stopName.trim(),
            stopOrder: s.stopOrder || idx + 1,
            pickupTime: s.pickupTime,
            dropTime: s.dropTime,
            fare: s.fare || 0,
          })),
        });
      }

      return tx.transportRoute.findUnique({
        where: { id: route.id },
        include: { stops: { orderBy: { stopOrder: 'asc' } }, vehicle: true },
      });
    });
  }

  async updateRoute(schoolId: string, id: string, data: Partial<CreateTransportRouteDTO>) {
    const route = await prisma.transportRoute.findFirst({ where: { id, schoolId } });
    if (!route) throw new AppError('Route not found.', 404);

    return prisma.transportRoute.update({
      where: { id },
      data: {
        routeName: data.routeName ? data.routeName.trim() : undefined,
        routeCode: data.routeCode ? data.routeCode.trim().toUpperCase() : undefined,
        vehicleId: data.vehicleId !== undefined ? data.vehicleId : undefined,
        startLocation: data.startLocation ? data.startLocation.trim() : undefined,
        endLocation: data.endLocation ? data.endLocation.trim() : undefined,
        monthlyFare: data.monthlyFare,
        status: data.status as any,
      },
      include: { stops: true, vehicle: true },
    });
  }

  async deleteRoute(schoolId: string, id: string) {
    const route = await prisma.transportRoute.findFirst({
      where: { id, schoolId },
      include: { allocations: true },
    });
    if (!route) throw new AppError('Route not found.', 404);
    if (route.allocations.length > 0) {
      throw new AppError('Cannot delete route with enrolled students allocated.', 400);
    }
    return prisma.transportRoute.delete({ where: { id } });
  }

  // ==========================================================================
  // 4. STUDENT TRANSPORT ALLOCATION
  // ==========================================================================
  async listAllocations(schoolId: string, routeId?: string) {
    const where: any = { schoolId };
    if (routeId) where.routeId = routeId;

    return prisma.studentTransportAllocation.findMany({
      where,
      include: {
        studentProfile: {
          include: {
            membership: { include: { user: true } },
            enrollments: { include: { class: true, section: true } },
          },
        },
        route: { include: { vehicle: true } },
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async allocateStudent(schoolId: string, data: AllocateStudentTransportDTO) {
    // Verify student belongs to school
    const student = await prisma.studentProfile.findFirst({
      where: {
        id: data.studentProfileId,
        membership: { schoolId },
      },
    });
    if (!student) throw new AppError('Student profile not found in this school.', 404);

    // Verify route belongs to school
    const route = await prisma.transportRoute.findFirst({
      where: { id: data.routeId, schoolId },
      include: { vehicle: true, allocations: true },
    });
    if (!route) throw new AppError('Transport route not found in this school.', 404);

    // Capacity check if vehicle assigned
    if (route.vehicle) {
      const activeCount = route.allocations.filter((a) => a.status === 'ACTIVE').length;
      if (activeCount >= route.vehicle.capacity) {
        throw new AppError(
          `Vehicle capacity exceeded: Route ${route.routeCode} is at maximum capacity (${route.vehicle.capacity} seats).`,
          400
        );
      }
    }

    // Verify stop belongs to route if provided
    if (data.stopId) {
      const stop = await prisma.transportRouteStop.findFirst({
        where: { id: data.stopId, routeId: data.routeId },
      });
      if (!stop) throw new AppError('Specified stop does not belong to this route.', 400);
    }

    return prisma.studentTransportAllocation.upsert({
      where: {
        schoolId_studentProfileId_routeId: {
          schoolId,
          studentProfileId: data.studentProfileId,
          routeId: data.routeId,
        },
      },
      update: {
        stopId: data.stopId || null,
        pickupType: data.pickupType as any || 'BOTH',
        status: 'ACTIVE',
        monthlyFare: data.monthlyFare || route.monthlyFare,
        notes: data.notes || undefined,
      },
      create: {
        schoolId,
        studentProfileId: data.studentProfileId,
        routeId: data.routeId,
        stopId: data.stopId || null,
        pickupType: data.pickupType as any || 'BOTH',
        status: 'ACTIVE',
        monthlyFare: data.monthlyFare || route.monthlyFare,
        notes: data.notes || undefined,
      },
      include: {
        route: true,
        stop: true,
        studentProfile: {
          include: { membership: { include: { user: true } } },
        },
      },
    });
  }

  async cancelAllocation(schoolId: string, id: string) {
    const allocation = await prisma.studentTransportAllocation.findFirst({
      where: { id, schoolId },
    });
    if (!allocation) throw new AppError('Transport allocation not found.', 404);

    return prisma.studentTransportAllocation.update({
      where: { id },
      data: { status: 'INACTIVE', endDate: new Date() },
    });
  }

  // ==========================================================================
  // 5. TELEMETRY & STATS
  // ==========================================================================
  async getTransportStats(schoolId: string) {
    const [vehicles, drivers, routes, allocations] = await Promise.all([
      prisma.transportVehicle.findMany({ where: { schoolId } }),
      prisma.transportDriver.findMany({ where: { schoolId } }),
      prisma.transportRoute.findMany({ where: { schoolId }, include: { vehicle: true } }),
      prisma.studentTransportAllocation.findMany({ where: { schoolId, status: 'ACTIVE' } }),
    ]);

    const totalCapacity = routes.reduce((acc, r) => acc + (r.vehicle?.capacity || 0), 0);
    const activeAllocations = allocations.length;
    const monthlyRevenue = allocations.reduce((acc, a) => acc + a.monthlyFare, 0);

    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.status === 'ACTIVE').length,
      totalDrivers: drivers.length,
      totalRoutes: routes.length,
      allocatedStudents: activeAllocations,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((activeAllocations / totalCapacity) * 100) : 0,
      monthlyRevenue,
    };
  }
}

export const transportService = new TransportService();

