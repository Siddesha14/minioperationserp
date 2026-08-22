import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createTransferSchema } from "./transfer.validator.js";

export async function createTransfer(
  req: Request,
  res: Response,
) {
  try {
    const result = createTransferSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      transferNumber,
      sourceLocationId,
      destinationLocationId,
      itemId,
      quantity,
    } = result.data;

    if (sourceLocationId === destinationLocationId) {
      return res.status(400).json({
        success: false,
        message:
          "Source and destination locations must be different",
      });
    }

    const existingTransfer =
      await prisma.stockTransfer.findUnique({
        where: {
          transferNumber,
        },
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
          where: {
            id: sourceLocationId,
          },
        }),

        prisma.location.findUnique({
          where: {
            id: destinationLocationId,
          },
        }),

        prisma.item.findUnique({
          where: {
            id: itemId,
          },
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

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        itemId,
        quantity,
        createdById: req.user!.userId,
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
      message: "Transfer created successfully",
      data: transfer,
    });
  } catch (error) {
    console.error("Create transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create transfer",
    });
  }
}
export async function getTransfers(
  _req: Request,
  res: Response,
) {
  try {
    const transfers = await prisma.$queryRaw<
      Array<{
        id: number;
        transferNumber: string;
        sourceLocationId: number;
        destinationLocationId: number;
        itemId: number;
        quantity: number;
        status: string;
        createdById: number;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationName: string;
        sourceLocationCode: string;
        destinationLocationName: string;
        destinationLocationCode: string;
        itemSku: string;
        itemName: string;
        createdByName: string;
        createdByEmail: string;
        createdByRole: string;
      }>
    >`
      SELECT
        st.id,
        st."transferNumber",
        st."sourceLocationId",
        st."destinationLocationId",
        st."itemId",
        st.quantity,
        st.status,
        st."createdById",
        st."createdAt",
        st."updatedAt",

        sl.name AS "sourceLocationName",
        sl.code AS "sourceLocationCode",

        dl.name AS "destinationLocationName",
        dl.code AS "destinationLocationCode",

        i.sku AS "itemSku",
        i.name AS "itemName",

        u.name AS "createdByName",
        u.email AS "createdByEmail",
        u.role AS "createdByRole"

      FROM "StockTransfer" st

      JOIN "Location" sl
        ON sl.id = st."sourceLocationId"

      JOIN "Location" dl
        ON dl.id = st."destinationLocationId"

      JOIN "Item" i
        ON i.id = st."itemId"

      JOIN "User" u
        ON u.id = st."createdById"

      ORDER BY st."createdAt" DESC
    `;

    const data = transfers.map((transfer) => ({
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceLocationId: transfer.sourceLocationId,
      destinationLocationId: transfer.destinationLocationId,
      itemId: transfer.itemId,
      quantity: transfer.quantity,
      status: transfer.status,
      createdById: transfer.createdById,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,

      sourceLocation: {
        id: transfer.sourceLocationId,
        name: transfer.sourceLocationName,
        code: transfer.sourceLocationCode,
      },

      destinationLocation: {
        id: transfer.destinationLocationId,
        name: transfer.destinationLocationName,
        code: transfer.destinationLocationCode,
      },

      item: {
        id: transfer.itemId,
        sku: transfer.itemSku,
        name: transfer.itemName,
      },

      createdBy: {
        id: transfer.createdById,
        name: transfer.createdByName,
        email: transfer.createdByEmail,
        role: transfer.createdByRole,
      },
    }));

    return res.status(200).json({
      success: true,
      data,
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

    const transfer =
      await prisma.stockTransfer.findUnique({
        where: {
          id,
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

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    if (req.user!.role !== "ADMIN") {
      const assignedLocationId =
        req.user!.assignedLocationId;

      if (
        transfer.sourceLocationId !==
          assignedLocationId &&
        transfer.destinationLocationId !==
          assignedLocationId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this transfer",
        });
      }
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

    const transfer =
      await prisma.stockTransfer.findUnique({
        where: {
          id,
        },
      });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    if (transfer.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message:
          "Only requested transfers can be dispatched",
      });
    }

    const updatedTransfer =
      await prisma.stockTransfer.update({
        where: {
          id,
        },
        data: {
          status: "DISPATCHED",
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
      message: "Transfer dispatched successfully",
      data: updatedTransfer,
    });
  } catch (error) {
    console.error("Dispatch transfer error:", error);

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

    const transfer = await prisma.stockTransfer.findUnique({
      where: {
        id,
      },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    if (transfer.status !== "DISPATCHED") {
      return res.status(400).json({
        success: false,
        message:
          "Only dispatched transfers can be received",
      });
    }

    const updatedTransfer = await prisma.$transaction(
      async (tx) => {
        // -----------------------------------------
        // 1. Find source inventory
        // -----------------------------------------
        const sourceInventory =
          await tx.inventory.findFirst({
            where: {
              itemId: transfer.itemId,
              locationId: transfer.sourceLocationId,
            },
          });

        if (!sourceInventory) {
          throw new Error(
            "Source inventory not found",
          );
        }

        // -----------------------------------------
        // 2. Check available source stock
        // -----------------------------------------
        const availableQuantity =
          sourceInventory.physicalQuantity -
          sourceInventory.reservedQuantity;

        if (availableQuantity < transfer.quantity) {
          throw new Error(
            `Insufficient available stock. Available: ${availableQuantity}, Required: ${transfer.quantity}`,
          );
        }

        // -----------------------------------------
        // 3. Find destination inventory
        // -----------------------------------------
        let destinationInventory =
          await tx.inventory.findFirst({
            where: {
              itemId: transfer.itemId,
              locationId:
                transfer.destinationLocationId,
            },
          });

        // -----------------------------------------
        // 4. Create destination inventory
        //    if it doesn't exist
        // -----------------------------------------
        if (!destinationInventory) {
          destinationInventory =
            await tx.inventory.create({
              data: {
                itemId: transfer.itemId,
                locationId:
                  transfer.destinationLocationId,
                batchId: sourceInventory.batchId,
                physicalQuantity: 0,
                reservedQuantity: 0,
              },
            });
        }

        // -----------------------------------------
        // 5. Remove stock from source
        // -----------------------------------------
        await tx.inventory.update({
          where: {
            id: sourceInventory.id,
          },
          data: {
            physicalQuantity: {
              decrement: transfer.quantity,
            },
          },
        });

        // -----------------------------------------
        // 6. Add stock to destination
        // -----------------------------------------
        await tx.inventory.update({
          where: {
            id: destinationInventory.id,
          },
          data: {
            physicalQuantity: {
              increment: transfer.quantity,
            },
          },
        });

        // -----------------------------------------
        // 7. Record TRANSFER_OUT
        // -----------------------------------------
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: sourceInventory.id,
            type: "TRANSFER_OUT",
            quantity: transfer.quantity,
            referenceId:
              transfer.transferNumber,
            reason:
              "Stock transfer dispatched",
            createdById: req.user!.userId,
          },
        });

        // -----------------------------------------
        // 8. Record TRANSFER_IN
        // -----------------------------------------
        await tx.inventoryTransaction.create({
          data: {
            inventoryId:
              destinationInventory.id,
            type: "TRANSFER_IN",
            quantity: transfer.quantity,
            referenceId:
              transfer.transferNumber,
            reason:
              "Stock transfer received",
            createdById: req.user!.userId,
          },
        });

        // -----------------------------------------
        // 9. Mark transfer as RECEIVED
        // -----------------------------------------
        return tx.stockTransfer.update({
          where: {
            id,
          },
          data: {
            status: "RECEIVED",
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
      },
    );

    return res.status(200).json({
      success: true,
      message: "Transfer received successfully",
      data: updatedTransfer,
    });
  } catch (error) {
    console.error(
      "Receive transfer error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to receive transfer";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}