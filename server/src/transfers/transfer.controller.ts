import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createTransferSchema } from "./transfer.validator.js";

export async function createTransfer(req: Request, res: Response) {
  try {
    const parsed = createTransferSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer data",
        errors: parsed.error.flatten(),
      });
    }

    const {
      transferNumber,
      sourceLocationId,
      destinationLocationId,
      itemId,
      quantity,
    } = parsed.data;

    if (sourceLocationId === destinationLocationId) {
      return res.status(400).json({
        success: false,
        message: "Source and destination locations must be different",
      });
    }

    const createdById = req.user!.userId;

    const existingTransfer = await prisma.stockTransfer.findUnique({
      where: { transferNumber },
    });

    if (existingTransfer) {
      return res.status(409).json({
        success: false,
        message: "Transfer number already exists",
      });
    }

    const [sourceLocation, destinationLocation, item] =
      await Promise.all([
        prisma.location.findUnique({
          where: { id: sourceLocationId },
        }),
        prisma.location.findUnique({
          where: { id: destinationLocationId },
        }),
        prisma.item.findUnique({
          where: { id: itemId },
        }),
      ]);

    if (!sourceLocation) {
      return res.status(404).json({
        success: false,
        message: "Source location not found",
      });
    }

    if (!destinationLocation) {
      return res.status(404).json({
        success: false,
        message: "Destination location not found",
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const sourceInventories = await prisma.inventory.findMany({
      where: {
        itemId,
        locationId: sourceLocationId,
      },
      select: {
        id: true,
        physicalQuantity: true,
        reservedQuantity: true,
      },
    });

    const availableQuantity = sourceInventories.reduce(
      (total, inventory) =>
        total +
        (inventory.physicalQuantity - inventory.reservedQuantity),
      0,
    );

    if (quantity > availableQuantity) {
      return res.status(409).json({
        success: false,
        message: "Cannot transfer more than available inventory",
        availableQuantity,
        requestedQuantity: quantity,
      });
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        itemId,
        quantity,
        createdById,
        status: "REQUESTED",
      },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        item: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Stock transfer requested successfully",
      data: transfer,
    });
  } catch (error) {
    console.error("Create transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create stock transfer",
    });
  }
}

export async function getTransfers(req: Request, res: Response) {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        item: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfers",
    });
  }
}

export async function getTransferById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer ID",
      });
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        item: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Get transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfer",
    });
  }
}

export async function dispatchTransfer(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer ID",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        throw new Error("TRANSFER_NOT_FOUND");
      }

      if (transfer.status !== "REQUESTED") {
        throw new Error("INVALID_DISPATCH_STATUS");
      }

      const inventories = await tx.inventory.findMany({
        where: {
          itemId: transfer.itemId,
          locationId: transfer.sourceLocationId,
        },
        orderBy: {
          id: "asc",
        },
      });

      let remaining = transfer.quantity;

      for (const inventory of inventories) {
        if (remaining <= 0) break;

        const available =
          inventory.physicalQuantity -
          inventory.reservedQuantity;

        if (available <= 0) continue;

        const deduct = Math.min(available, remaining);

        const updated = await tx.inventory.updateMany({
          where: {
            id: inventory.id,
            physicalQuantity: {
              gte: inventory.reservedQuantity + deduct,
            },
          },
          data: {
            physicalQuantity: {
              decrement: deduct,
            },
          },
        });

        if (updated.count !== 1) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: "TRANSFER_OUT",
            quantity: deduct,
            referenceId: transfer.transferNumber,
            reason: `Transfer dispatch ${transfer.transferNumber}`,
            createdById: req.user!.userId,
          },
        });

        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      return tx.stockTransfer.update({
        where: { id },
        data: {
          status: "DISPATCHED",
        },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Stock transfer dispatched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Dispatch transfer error:", error);

    if (error instanceof Error) {
      if (error.message === "TRANSFER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Transfer not found",
        });
      }

      if (error.message === "INVALID_DISPATCH_STATUS") {
        return res.status(409).json({
          success: false,
          message: "Only requested transfers can be dispatched",
        });
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return res.status(409).json({
          success: false,
          message: "Insufficient available inventory",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to dispatch transfer",
    });
  }
}

export async function receiveTransfer(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer ID",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        throw new Error("TRANSFER_NOT_FOUND");
      }

      if (transfer.status !== "DISPATCHED") {
        throw new Error("INVALID_RECEIVE_STATUS");
      }

      let inventory = await tx.inventory.findFirst({
        where: {
          itemId: transfer.itemId,
          locationId: transfer.destinationLocationId,
        },
      });

      if (!inventory) {
        const batch = await tx.batch.findFirst({
          where: {
            itemId: transfer.itemId,
          },
          orderBy: {
            id: "asc",
          },
        });

        if (!batch) {
          throw new Error("BATCH_NOT_FOUND");
        }

        inventory = await tx.inventory.create({
          data: {
            itemId: transfer.itemId,
            locationId: transfer.destinationLocationId,
            batchId: batch.id,
            physicalQuantity: 0,
            reservedQuantity: 0,
          },
        });
      }

      const updatedInventory = await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          physicalQuantity: {
            increment: transfer.quantity,
          },
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: updatedInventory.id,
          type: "TRANSFER_IN",
          quantity: transfer.quantity,
          referenceId: transfer.transferNumber,
          reason: `Transfer receipt ${transfer.transferNumber}`,
          createdById: req.user!.userId,
        },
      });

      return tx.stockTransfer.update({
        where: { id },
        data: {
          status: "RECEIVED",
        },
        include: {
          sourceLocation: true,
          destinationLocation: true,
          item: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Stock transfer received successfully",
      data: result,
    });
  } catch (error) {
    console.error("Receive transfer error:", error);

    if (error instanceof Error) {
      if (error.message === "TRANSFER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Transfer not found",
        });
      }

      if (error.message === "INVALID_RECEIVE_STATUS") {
        return res.status(409).json({
          success: false,
          message: "Only dispatched transfers can be received",
        });
      }

      if (error.message === "BATCH_NOT_FOUND") {
        return res.status(409).json({
          success: false,
          message: "No batch exists for this item",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to receive transfer",
    });
  }
}