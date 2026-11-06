import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import {
  CreateInventoryCategorySchema,
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  RecordInventoryTransactionSchema,
} from '@edunexa/shared';

export class InventoryController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const stats = await inventoryService.getInventoryStats(schoolId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // Categories
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const categories = await inventoryService.listCategories(schoolId);
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = CreateInventoryCategorySchema.parse(req.body);
      const category = await inventoryService.createCategory(schoolId, validated);
      res.status(201).json({ success: true, data: category, message: 'Inventory category created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await inventoryService.deleteCategory(schoolId, id);
      res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Items
  async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { categoryId, status, search } = req.query as any;
      const items = await inventoryService.listItems(schoolId, { categoryId, status, search });
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await inventoryService.getItemById(schoolId, id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = CreateInventoryItemSchema.parse(req.body);
      const item = await inventoryService.createItem(schoolId, validated);
      res.status(201).json({ success: true, data: item, message: 'Inventory item registered successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const validated = UpdateInventoryItemSchema.parse(req.body);
      const item = await inventoryService.updateItem(schoolId, id, validated);
      res.json({ success: true, data: item, message: 'Inventory item updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await inventoryService.deleteItem(schoolId, id);
      res.json({ success: true, message: 'Inventory item deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Transactions
  async recordTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const validated = RecordInventoryTransactionSchema.parse(req.body);
      const result = await inventoryService.recordTransaction(schoolId, validated);
      res.status(201).json({
        success: true,
        data: result,
        message: `Inventory stock transaction (${validated.transactionType}) processed successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const itemId = req.query.itemId as string;
      const transactions = await inventoryService.listTransactions(schoolId, itemId);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();

