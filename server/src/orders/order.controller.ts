import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createOrderSchema } from "./order.validator.js";

export async function createOrder(req: Request, res: Response) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
        errors: parsed.error.flatten(),
      });
    }

    const { orderNumber, customerId, items } = parsed.data;

    const existingOrder = await prisma.customerOrder.findUnique({
      where: { orderNumber },
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Order number already exists",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const itemIds = items.map((item) => item.itemId);

    const uniqueItemIds = new Set(itemIds);

    if (uniqueItemIds.size !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate items are not allowed in the same order",
      });
    }

    const existingItems = await prisma.item.findMany({
      where: {
        id: {
          in: itemIds,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
      },
    });

    if (existingItems.length !== itemIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more items were not found",
      });
    }

    const order = await prisma.customerOrder.create({
      data: {
        orderNumber,
        customerId,
        createdById: req.user!.userId,
        status: "DRAFT",
        items: {
          create: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Customer order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer order",
    });
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.customerOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            item: true,
            reservations: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}

export async function getOrderById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            item: true,
            reservations: {
              include: {
                inventory: {
                  include: {
                    location: true,
                    batch: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
}
export async function cancelOrder(
  req: Request,
  res: Response,
) {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              reservations: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.status !== "RESERVED") {
        throw new Error("INVALID_ORDER_STATUS");
      }

      for (const orderItem of order.items) {
        for (const reservation of orderItem.reservations) {
          if (reservation.releasedAt) {
            continue;
          }

          const updatedInventory = await tx.inventory.updateMany({
            where: {
              id: reservation.inventoryId,
              reservedQuantity: {
                gte: reservation.quantity,
              },
            },
            data: {
              reservedQuantity: {
                decrement: reservation.quantity,
              },
            },
          });

          if (updatedInventory.count !== 1) {
            throw new Error("RELEASE_CONFLICT");
          }

          await tx.reservation.update({
            where: {
              id: reservation.id,
            },
            data: {
              releasedAt: new Date(),
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: reservation.inventoryId,
              type: "RELEASE",
              quantity: reservation.quantity,
              referenceId: order.orderNumber,
              reason: `Reservation released for ${order.orderNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      return tx.customerOrder.update({
        where: {
          id: orderId,
        },
        data: {
          status: "CANCELLED",
        },
        include: {
          customer: true,
          items: {
            include: {
              item: true,
              reservations: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled and reservations released",
      data: result,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message === "INVALID_ORDER_STATUS") {
        return res.status(409).json({
          success: false,
          message: "Only reserved orders can be cancelled",
        });
      }

      if (error.message === "RELEASE_CONFLICT") {
        return res.status(409).json({
          success: false,
          message: "Unable to release reservation",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
}

export async function reserveOrder(
  req: Request,
  res: Response,
) {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.status !== "DRAFT") {
        throw new Error("INVALID_ORDER_STATUS");
      }

      const reservations = [];

      for (const orderItem of order.items) {
        let remaining = orderItem.quantity;

        const inventories = await tx.inventory.findMany({
          where: {
            itemId: orderItem.itemId,
          },
          orderBy: {
            id: "asc",
          },
        });

        for (const inventory of inventories) {
          if (remaining <= 0) break;

          const available =
            inventory.physicalQuantity -
            inventory.reservedQuantity;

          if (available <= 0) continue;

          const reserveQuantity = Math.min(
            available,
            remaining,
          );

          /*
           * Atomic conditional update.
           *
           * This is the important part for concurrency.
           * The database only updates the row if enough
           * available stock still exists.
           */
          const updated = await tx.inventory.updateMany({
            where: {
              id: inventory.id,
              physicalQuantity: {
                gte:
                  inventory.reservedQuantity +
                  reserveQuantity,
              },
              reservedQuantity: {
                lte:
                  inventory.physicalQuantity -
                  reserveQuantity,
              },
            },
            data: {
              reservedQuantity: {
                increment: reserveQuantity,
              },
            },
          });

          if (updated.count !== 1) {
            throw new Error("RESERVATION_CONFLICT");
          }

          const reservation = await tx.reservation.create({
            data: {
              orderItemId: orderItem.id,
              inventoryId: inventory.id,
              quantity: reserveQuantity,
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: "RESERVATION",
              quantity: reserveQuantity,
              referenceId: order.orderNumber,
              reason: `Reservation for ${order.orderNumber}`,
              createdById: req.user!.userId,
            },
          });

          reservations.push(reservation);

          remaining -= reserveQuantity;
        }

        if (remaining > 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const updatedOrder = await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          status: "RESERVED",
        },
        include: {
          customer: true,
          items: {
            include: {
              item: true,
              reservations: true,
            },
          },
        },
      });

      return {
        order: updatedOrder,
        reservations,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Order reserved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Reserve order error:", error);

    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message === "INVALID_ORDER_STATUS") {
        return res.status(409).json({
          success: false,
          message: "Only draft orders can be reserved",
        });
      }

      if (
        error.message === "INSUFFICIENT_STOCK" ||
        error.message === "RESERVATION_CONFLICT"
      ) {
        return res.status(409).json({
          success: false,
          message: "Insufficient available inventory",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to reserve order",
    });
  }
}
export async function completeorder(
  req: Request,
  res: Response,
) {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              reservations: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.status !== "RESERVED") {
        throw new Error("INVALID_ORDER_STATUS");
      }

      for (const orderItem of order.items) {
        for (const reservation of orderItem.reservations) {
          if (reservation.releasedAt) {
            throw new Error("INVALID_RESERVATION");
          }

          const updatedInventory = await tx.inventory.updateMany({
            where: {
              id: reservation.inventoryId,
              reservedQuantity: {
                gte: reservation.quantity,
              },
              physicalQuantity: {
                gte: reservation.quantity,
              },
            },
            data: {
              physicalQuantity: {
                decrement: reservation.quantity,
              },
              reservedQuantity: {
                decrement: reservation.quantity,
              },
            },
          });

          if (updatedInventory.count !== 1) {
            throw new Error("COMPLETION_CONFLICT");
          }

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: reservation.inventoryId,
              type: "SALE",
              quantity: reservation.quantity,
              referenceId: order.orderNumber,
              reason: `Sale for ${order.orderNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      return tx.customerOrder.update({
        where: {
          id: orderId,
        },
        data: {
          status: "COMPLETED",
        },
        include: {
          customer: true,
          items: {
            include: {
              item: true,
              reservations: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Order completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Complete order error:", error);

    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (error.message === "INVALID_ORDER_STATUS") {
        return res.status(409).json({
          success: false,
          message: "Only reserved orders can be completed",
        });
      }

      if (
        error.message === "INVALID_RESERVATION" ||
        error.message === "COMPLETION_CONFLICT"
      ) {
        return res.status(409).json({
          success: false,
          message: "Unable to complete order",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to complete order",
    });
  }
}