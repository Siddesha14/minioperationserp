import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

export async function getDashboardSummary(
  _req: Request,
  res: Response,
) {
  try {
    const [
      totalItems,
      totalCustomers,
      totalInventoryRecords,
      inventoryTotals,
      orderCounts,
      workOrderCounts,
      transferCounts,
      transactionCounts,
      lowStockInventory,
      recentTransactions,
    ] = await Promise.all([
      prisma.item.count(),

      prisma.customer.count(),

      prisma.inventory.count(),

      prisma.inventory.aggregate({
        _sum: {
          physicalQuantity: true,
          reservedQuantity: true,
        },
      }),

      prisma.customerOrder.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.workOrder.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.stockTransfer.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.inventoryTransaction.groupBy({
        by: ["type"],
        _count: {
          _all: true,
        },
      }),

      prisma.inventory.findMany({
        where: {
          physicalQuantity: {
            lt: 10,
          },
        },
        orderBy: {
          physicalQuantity: "asc",
        },
        take: 10,
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

      prisma.inventoryTransaction.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          inventory: {
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
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const physicalQuantity =
      inventoryTotals._sum.physicalQuantity ?? 0;

    const reservedQuantity =
      inventoryTotals._sum.reservedQuantity ?? 0;

    const availableQuantity =
      physicalQuantity - reservedQuantity;

    const orders = {
      draft: 0,
      reserved: 0,
      cancelled: 0,
      completed: 0,
    };

    for (const row of orderCounts) {
      orders[row.status.toLowerCase() as keyof typeof orders] =
        row._count._all;
    }

    const workOrders = {
      assigned: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const row of workOrderCounts) {
      if (row.status === "IN_PROGRESS") {
        workOrders.inProgress = row._count._all;
      } else {
        workOrders[row.status.toLowerCase() as keyof typeof workOrders] =
          row._count._all;
      }
    }

    const transfers = {
      requested: 0,
      dispatched: 0,
      received: 0,
    };

    for (const row of transferCounts) {
      transfers[row.status.toLowerCase() as keyof typeof transfers] =
        row._count._all;
    }

    const transactions = {
      receipt: 0,
      adjustmentIn: 0,
      adjustmentOut: 0,
      transferOut: 0,
      transferIn: 0,
      reservation: 0,
      release: 0,
      sale: 0,
    };

    for (const row of transactionCounts) {
      switch (row.type) {
        case "RECEIPT":
          transactions.receipt = row._count._all;
          break;
        case "ADJUSTMENT_IN":
          transactions.adjustmentIn = row._count._all;
          break;
        case "ADJUSTMENT_OUT":
          transactions.adjustmentOut = row._count._all;
          break;
        case "TRANSFER_OUT":
          transactions.transferOut = row._count._all;
          break;
        case "TRANSFER_IN":
          transactions.transferIn = row._count._all;
          break;
        case "RESERVATION":
          transactions.reservation = row._count._all;
          break;
        case "RELEASE":
          transactions.release = row._count._all;
          break;
        case "SALE":
          transactions.sale = row._count._all;
          break;
      }
    }

    const formattedLowStock = lowStockInventory
  .map((inventory) => ({
    id: inventory.id,
    item: inventory.item,
    location: inventory.location,
    batch: inventory.batch,
    physicalQuantity: inventory.physicalQuantity,
    reservedQuantity: inventory.reservedQuantity,
    availableQuantity:
      inventory.physicalQuantity - inventory.reservedQuantity,
  }))
  .filter((inventory) => inventory.availableQuantity < 10)
  .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        inventory: {
          totalItems,
          totalInventoryRecords,
          totalPhysicalQuantity: physicalQuantity,
          totalReservedQuantity: reservedQuantity,
          totalAvailableQuantity: availableQuantity,
        },

        customers: {
          total: totalCustomers,
        },

        orders,

        workOrders,

        transfers,

        transactions,

        lowStock: formattedLowStock,

        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
}