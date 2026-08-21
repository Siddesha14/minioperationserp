import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createItemSchema } from "./item.validator.js";

export async function getItems(
  _req: Request,
  res: Response,
) {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        category: true,
        batches: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch items",
    });
  }
}

export async function getItemById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        batches: true,
        inventories: {
          include: {
            location: true,
            batch: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch item",
    });
  }
}

export async function createItem(
  req: Request,
  res: Response,
) {
  try {
    const result = createItemSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid item data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      sku,
      name,
      description,
      categoryId,
    } = result.data;

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const existing = await prisma.item.findUnique({
      where: {
        sku,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const item = await prisma.item.create({
      data: {
        sku,
        name,
        description: description || null,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create item",
    });
  }
}