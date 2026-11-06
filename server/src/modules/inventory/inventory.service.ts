import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateInventoryCategoryDTO,
  CreateInventoryItemDTO,
  UpdateInventoryItemDTO,
  RecordInventoryTransactionDTO,
} from '@edunexa/shared';

export class InventoryService {
  // ==========================================================================
  // 1. CATEGORIES
  // ==========================================================================
  async listCategories(schoolId: string) {
    return prisma.inventoryCategory.findMany({
      where: { schoolId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(schoolId: string, data: CreateInventoryCategoryDTO) {
    const existing = await prisma.inventoryCategory.findFirst({
      where: { schoolId, code: data.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new AppError('Category with this code already exists.', 409);
    }

    return prisma.inventoryCategory.create({
      data: {
        schoolId,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description ? data.description.trim() : null,
      },
    });
  }

  async deleteCategory(schoolId: string, id: string) {
    const category = await prisma.inventoryCategory.findFirst({
      where: { id, schoolId },
      include: { items: true },
    });
    if (!category) throw new AppError('Category not found.', 404);
    if (category.items.length > 0) {
      throw new AppError('Cannot delete category containing existing inventory items.', 400);
    }
    return prisma.inventoryCategory.delete({ where: { id } });
  }

  // ==========================================================================
  // 2. ITEMS
  // ==========================================================================
  async listItems(schoolId: string, filters?: { categoryId?: string; status?: string; search?: string }) {
    const where: any = { schoolId };
    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      where.categoryId = filters.categoryId;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.OR = [
        { itemName: { contains: filters.search, mode: 'insensitive' } },
        { itemCode: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        transactions: {
          take: 5,
          orderBy: { transactionDate: 'desc' },
        },
      },
      orderBy: { itemName: 'asc' },
    });
  }

  async getItemById(schoolId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, schoolId },
      include: {
        category: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    });
    if (!item) throw new AppError('Inventory item not found.', 404);
    return item;
  }

  async createItem(schoolId: string, data: CreateInventoryItemDTO) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { schoolId, itemCode: data.itemCode.trim().toUpperCase() },
    });
    if (existing) {
      throw new AppError('An item with this item code already exists.', 409);
    }

    const category = await prisma.inventoryCategory.findFirst({
      where: { id: data.categoryId, schoolId },
    });
    if (!category) throw new AppError('Inventory category not found.', 404);

    let status: any = 'IN_STOCK';
    if (data.quantity === 0) status = 'OUT_OF_STOCK';
    else if (data.quantity <= data.minStockAlert) status = 'LOW_STOCK';

    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          schoolId,
          categoryId: data.categoryId,
          itemName: data.itemName.trim(),
          itemCode: data.itemCode.trim().toUpperCase(),
          quantity: data.quantity || 0,
          unit: data.unit || 'Units',
          minStockAlert: data.minStockAlert ?? 5,
          unitPrice: data.unitPrice || 0,
          location: data.location ? data.location.trim() : null,
          status,
        },
        include: { category: true },
      });

      if (data.quantity > 0) {
        await tx.inventoryTransaction.create({
          data: {
            schoolId,
            itemId: item.id,
            transactionType: 'PURCHASE',
            quantity: data.quantity,
            unitPrice: data.unitPrice || 0,
            totalAmount: (data.unitPrice || 0) * data.quantity,
            notes: 'Initial stock opening balance',
          },
        });
      }

      return item;
    });
  }

  async updateItem(schoolId: string, id: string, data: UpdateInventoryItemDTO) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, schoolId },
    });
    if (!item) throw new AppError('Inventory item not found.', 404);

    return prisma.inventoryItem.update({
      where: { id },
      data: {
        itemName: data.itemName ? data.itemName.trim() : undefined,
        itemCode: data.itemCode ? data.itemCode.trim().toUpperCase() : undefined,
        categoryId: data.categoryId,
        unit: data.unit,
        minStockAlert: data.minStockAlert,
        unitPrice: data.unitPrice,
        location: data.location !== undefined ? data.location : undefined,
      },
      include: { category: true },
    });
  }

  async deleteItem(schoolId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, schoolId },
      include: { transactions: true },
    });
    if (!item) throw new AppError('Item not found.', 404);
    if (item.quantity > 0) {
      throw new AppError('Cannot delete item with remaining stock on hand.', 400);
    }
    return prisma.inventoryItem.delete({ where: { id } });
  }

  // ==========================================================================
  // 3. TRANSACTIONS (PURCHASE, ISSUE, RETURN, DISPOSAL)
  // ==========================================================================
  async recordTransaction(schoolId: string, data: RecordInventoryTransactionDTO) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: data.itemId, schoolId },
    });
    if (!item) throw new AppError('Inventory item not found.', 404);

    return prisma.$transaction(async (tx) => {
      let newQuantity = item.quantity;

      if (data.transactionType === 'ISSUE' || data.transactionType === 'DISPOSAL') {
        if (item.quantity < data.quantity) {
          throw new AppError(
            `Insufficient stock: Cannot ${data.transactionType.toLowerCase()} ${data.quantity} units. Only ${item.quantity} available in stock.`,
            400
          );
        }
        newQuantity -= data.quantity;
      } else if (data.transactionType === 'PURCHASE' || data.transactionType === 'RETURN') {
        newQuantity += data.quantity;
      } else if (data.transactionType === 'ADJUSTMENT') {
        newQuantity = data.quantity;
      }

      let newStatus: any = 'IN_STOCK';
      if (newQuantity === 0) newStatus = 'OUT_OF_STOCK';
      else if (newQuantity <= item.minStockAlert) newStatus = 'LOW_STOCK';

      // Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: newQuantity,
          status: newStatus,
        },
      });

      const effectiveUnitPrice = data.unitPrice ?? item.unitPrice;
      const totalAmount = effectiveUnitPrice * data.quantity;

      // Create transaction log
      const transaction = await tx.inventoryTransaction.create({
        data: {
          schoolId,
          itemId: item.id,
          transactionType: data.transactionType,
          quantity: data.quantity,
          unitPrice: effectiveUnitPrice,
          totalAmount,
          issuedToName: data.issuedToName ? data.issuedToName.trim() : null,
          recipientRole: data.recipientRole || null,
          referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null,
          notes: data.notes ? data.notes.trim() : null,
        },
        include: { item: { include: { category: true } } },
      });

      return { transaction, updatedItem };
    });
  }

  async listTransactions(schoolId: string, itemId?: string) {
    const where: any = { schoolId };
    if (itemId) where.itemId = itemId;

    return prisma.inventoryTransaction.findMany({
      where,
      include: {
        item: { include: { category: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 100,
    });
  }

  // ==========================================================================
  // 4. TELEMETRY & STATS
  // ==========================================================================
  async getInventoryStats(schoolId: string) {
    const [categories, items, transactions] = await Promise.all([
      prisma.inventoryCategory.findMany({ where: { schoolId } }),
      prisma.inventoryItem.findMany({ where: { schoolId } }),
      prisma.inventoryTransaction.findMany({
        where: { schoolId },
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: { item: true },
      }),
    ]);

    const totalItems = items.length;
    const totalStockUnits = items.reduce((acc, i) => acc + i.quantity, 0);
    const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length;
    const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK').length;
    const totalAssetValuation = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

    return {
      totalCategories: categories.length,
      totalItems,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      totalAssetValuation,
      recentTransactions: transactions,
    };
  }
}

export const inventoryService = new InventoryService();

