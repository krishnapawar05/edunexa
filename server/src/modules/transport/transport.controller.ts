import { Request, Response, NextFunction } from 'express';
import { transportService } from './transport.service.js';
import {
  CreateTransportVehicleSchema,
  CreateTransportDriverSchema,
  CreateTransportRouteSchema,
  AllocateStudentTransportSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class TransportController {
  // Stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const stats = await transportService.getTransportStats(schoolId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // Vehicles
  async listVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const status = req.query.status as string;
      const vehicles = await transportService.listVehicles(schoolId, status);
      res.json({ success: true, data: vehicles });
    } catch (err) {
      next(err);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = CreateTransportVehicleSchema.parse(req.body);
      const vehicle = await transportService.createVehicle(schoolId, validated);
      res.status(201).json({ success: true, data: vehicle, message: 'Vehicle registered successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const vehicle = await transportService.updateVehicle(schoolId, id, req.body);
      res.json({ success: true, data: vehicle, message: 'Vehicle updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await transportService.deleteVehicle(schoolId, id);
      res.json({ success: true, message: 'Vehicle deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Drivers
  async listDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const drivers = await transportService.listDrivers(schoolId);
      res.json({ success: true, data: drivers });
    } catch (err) {
      next(err);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = CreateTransportDriverSchema.parse(req.body);
      const driver = await transportService.createDriver(schoolId, validated);
      res.status(201).json({ success: true, data: driver, message: 'Driver created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async updateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const driver = await transportService.updateDriver(schoolId, id, req.body);
      res.json({ success: true, data: driver, message: 'Driver updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await transportService.deleteDriver(schoolId, id);
      res.json({ success: true, message: 'Driver deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Routes
  async listRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const routes = await transportService.listRoutes(schoolId);
      res.json({ success: true, data: routes });
    } catch (err) {
      next(err);
    }
  }

  async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = CreateTransportRouteSchema.parse(req.body);
      const route = await transportService.createRoute(schoolId, validated);
      res.status(201).json({ success: true, data: route, message: 'Transport route created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async updateRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const route = await transportService.updateRoute(schoolId, id, req.body);
      res.json({ success: true, data: route, message: 'Route updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await transportService.deleteRoute(schoolId, id);
      res.json({ success: true, message: 'Route deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Allocations
  async listAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const routeId = req.query.routeId as string;
      const allocations = await transportService.listAllocations(schoolId, routeId);
      res.json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }

  async allocateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = AllocateStudentTransportSchema.parse(req.body);
      const allocation = await transportService.allocateStudent(schoolId, validated);
      res.status(201).json({ success: true, data: allocation, message: 'Student allocated to route successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async cancelAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await transportService.cancelAllocation(schoolId, id);
      res.json({ success: true, message: 'Transport allocation cancelled successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const transportController = new TransportController();

