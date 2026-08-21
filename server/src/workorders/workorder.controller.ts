import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
} from "./workorder.validator.js";

export async function createWorkOrder(req: Request, res: Response) {
  try {
    const parsed = createWorkOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid work order data",
        errors: parsed.error.flatten(),
      });
    }

    const {
      workOrderNumber,
      locationId,
      itemId,
      requiredQuantity,
      assignedUserId,
    } = parsed.data;

    const [location, item, assignedUser] = await Promise.all([
      prisma.location.findUnique({
        where: { id: locationId },
      }),
      prisma.item.findUnique({
        where: { id: itemId },
      }),
      prisma.user.findUnique({
        where: { id: assignedUserId },
      }),
    ]);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found",
      });
    }

    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { workOrderNumber },
    });

    if (existingWorkOrder) {
      return res.status(409).json({
        success: false,
        message: "Work order number already exists",
      });
    }

    const inventories = await prisma.inventory.findMany({
      where: {
        itemId,
        locationId,
      },
      select: {
        physicalQuantity: true,
        reservedQuantity: true,
      },
    });

    const availableQuantity = inventories.reduce(
      (total, inventory) =>
        total + (inventory.physicalQuantity - inventory.reservedQuantity),
      0,
    );

    const shortage = Math.max(
      requiredQuantity - availableQuantity,
      0,
    );

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        locationId,
        itemId,
        requiredQuantity,
        assignedUserId,
        status: "ASSIGNED",
      },
      include: {
        location: true,
        item: true,
        assignedUser: {
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
      message: "Work order created successfully",
      data: {
        ...workOrder,
        stockCheck: {
          requiredQuantity,
          availableQuantity,
          shortage,
          sufficientStock: shortage === 0,
        },
      },
    });
  } catch (error) {
    console.error("Create work order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create work order",
    });
  }
}

export async function getWorkOrders(req: Request, res: Response) {
  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        location: true,
        item: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const data = await Promise.all(
      workOrders.map(async (workOrder) => {
        const inventories = await prisma.inventory.findMany({
          where: {
            itemId: workOrder.itemId,
            locationId: workOrder.locationId,
          },
          select: {
            physicalQuantity: true,
            reservedQuantity: true,
          },
        });

        const availableQuantity = inventories.reduce(
          (total, inventory) =>
            total +
            (inventory.physicalQuantity - inventory.reservedQuantity),
          0,
        );

        const shortage = Math.max(
          workOrder.requiredQuantity - availableQuantity,
          0,
        );

        return {
          ...workOrder,
          stockCheck: {
            requiredQuantity: workOrder.requiredQuantity,
            availableQuantity,
            shortage,
            sufficientStock: shortage === 0,
          },
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get work orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work orders",
    });
  }
}

export async function getWorkOrderById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid work order ID",
      });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        location: true,
        item: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: "Work order not found",
      });
    }

    const inventories = await prisma.inventory.findMany({
      where: {
        itemId: workOrder.itemId,
        locationId: workOrder.locationId,
      },
      select: {
        physicalQuantity: true,
        reservedQuantity: true,
      },
    });

    const availableQuantity = inventories.reduce(
      (total, inventory) =>
        total + (inventory.physicalQuantity - inventory.reservedQuantity),
      0,
    );

    const shortage = Math.max(
      workOrder.requiredQuantity - availableQuantity,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        ...workOrder,
        stockCheck: {
          requiredQuantity: workOrder.requiredQuantity,
          availableQuantity,
          shortage,
          sufficientStock: shortage === 0,
        },
      },
    });
  } catch (error) {
    console.error("Get work order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work order",
    });
  }
}

export async function updateWorkOrderStatus(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid work order ID",
      });
    }

    const parsed = updateWorkOrderStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: parsed.error.flatten(),
      });
    }

    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!existingWorkOrder) {
      return res.status(404).json({
        success: false,
        message: "Work order not found",
      });
    }

    const allowedTransitions: Record<string, string[]> = {
      ASSIGNED: ["IN_PROGRESS"],
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: [],
    };

    const currentStatus = existingWorkOrder.status;
    const nextStatus = parsed.data.status;

    if (
      currentStatus !== nextStatus &&
      !allowedTransitions[currentStatus]?.includes(nextStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      });
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        status: nextStatus,
      },
      include: {
        location: true,
        item: true,
        assignedUser: {
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
      message: "Work order status updated successfully",
      data: workOrder,
    });
  } catch (error) {
    console.error("Update work order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update work order status",
    });
  }
}