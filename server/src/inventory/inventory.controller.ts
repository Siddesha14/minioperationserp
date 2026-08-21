import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  inventoryQuerySchema,
  createInventorySchema,
  adjustInventorySchema,
} from "./inventory.validator.js";

export const getInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const result = inventoryQuerySchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      page,
      limit,
      locationId,
      itemId,
      batchId,
    } = result.data;

    const skip = (page - 1) * limit;

    const where = {
      ...(locationId ? { locationId } : {}),
      ...(itemId ? { itemId } : {}),
      ...(batchId ? { batchId } : {}),
    };

    const [inventory, total] = await prisma.$transaction([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          batch: {
            select: {
              id: true,
              batchNumber: true,
            },
          },
        },
      }),

      prisma.inventory.count({
        where,
      }),
    ]);

    const data = inventory.map((record) => ({
      ...record,
      availableQuantity:
        record.physicalQuantity - record.reservedQuantity,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

export const createInventoryReceipt = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = createInventorySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      itemId,
      locationId,
      batchId,
      quantity,
      reason,
    } = result.data;
    if (
  req.user.role !== "ADMIN" &&
  req.user.assignedLocationId !== locationId
) {
  return res.status(403).json({
    success: false,
    message: "You can only modify inventory at your assigned location",
  });
}

    const inventory = await prisma.$transaction(async (tx) => {
      const [item, location, batch] = await Promise.all([
        tx.item.findUnique({
          where: { id: itemId },
        }),

        tx.location.findUnique({
          where: { id: locationId },
        }),

        tx.batch.findUnique({
          where: { id: batchId },
        }),
      ]);

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (!location) {
        throw new Error("LOCATION_NOT_FOUND");
      }

      if (!batch || batch.itemId !== itemId) {
        throw new Error("INVALID_BATCH");
      }

      const existing = await tx.inventory.findUnique({
        where: {
          itemId_locationId_batchId: {
            itemId,
            locationId,
            batchId,
          },
        },
      });

      let inventoryRecord;

      if (existing) {
        inventoryRecord = await tx.inventory.update({
          where: {
            id: existing.id,
          },
          data: {
            physicalQuantity: {
              increment: quantity,
            },
          },
        });
      } else {
        inventoryRecord = await tx.inventory.create({
          data: {
            itemId,
            locationId,
            batchId,
            physicalQuantity: quantity,
            reservedQuantity: 0,
          },
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventoryRecord.id,
          type: "RECEIPT",
          quantity,
          reason,
          createdById: req.user!.userId,
        },
      });

      return inventoryRecord;
    });

    return res.status(201).json({
      success: true,
      message: "Inventory received successfully",
      data: {
        ...inventory,
        availableQuantity:
          inventory.physicalQuantity -
          inventory.reservedQuantity,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ITEM_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (error.message === "LOCATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      if (error.message === "INVALID_BATCH") {
        return res.status(400).json({
          success: false,
          message: "Batch does not belong to the selected item",
        });
      }
    }

    console.error("Create inventory receipt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to receive inventory",
    });
  }
};

export const adjustInventory = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = adjustInventorySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      inventoryId,
      quantity,
      type,
      reason,
    } = result.data;

    const inventory = await prisma.$transaction(async (tx) => {
      const record = await tx.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!record) {
        throw new Error("INVENTORY_NOT_FOUND");
      }
      if (
  req.user!.role !== "ADMIN" &&
  req.user!.assignedLocationId !== record.locationId
) {
  throw new Error("LOCATION_ACCESS_DENIED");
}

      let updated;

      if (type === "ADJUSTMENT_IN") {
        updated = await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            physicalQuantity: {
              increment: quantity,
            },
          },
        });
      } else {
        const available =
          record.physicalQuantity -
          record.reservedQuantity;

        if (available < quantity) {
          throw new Error("INSUFFICIENT_AVAILABLE_STOCK");
        }

        updated = await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            physicalQuantity: {
              decrement: quantity,
            },
          },
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId,
          type,
          quantity,
          reason,
          createdById: req.user!.userId,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: "Inventory adjusted successfully",
      data: {
        ...inventory,
        availableQuantity:
          inventory.physicalQuantity -
          inventory.reservedQuantity,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
        if (error.message === "LOCATION_ACCESS_DENIED") {
  return res.status(403).json({
    success: false,
    message: "You can only modify inventory at your assigned location",
  });
}
      if (error.message === "INVENTORY_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Inventory record not found",
        });
      }
      
      if (
        error.message ===
        "INSUFFICIENT_AVAILABLE_STOCK"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot reduce inventory below available quantity",
        });
      }
    }

    console.error("Adjust inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to adjust inventory",
    });
  }
};