import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createCustomerSchema } from "./customer.validator.js";

export async function getCustomers(
  _req: Request,
  res: Response,
) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
}

export async function createCustomer(
  req: Request,
  res: Response,
) {
  try {
    const result = createCustomerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, phone } = result.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
}