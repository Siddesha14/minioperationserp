import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../src/config/env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  const bangalore = await prisma.location.upsert({
    where: {
      code: "BLR",
    },
    update: {},
    create: {
      name: "Bangalore",
      code: "BLR",
    },
  });

  const mumbai = await prisma.location.upsert({
    where: {
      code: "MUM",
    },
    update: {},
    create: {
      name: "Mumbai",
      code: "MUM",
    },
  });

  const passwordHash = await bcrypt.hash("Password@123", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@erp.com",
    },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@erp.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "operations@erp.com",
    },
    update: {},
    create: {
      name: "Operations User",
      email: "operations@erp.com",
      passwordHash,
      role: "OPERATIONS",
      assignedLocationId: bangalore.id,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "sales@erp.com",
    },
    update: {},
    create: {
      name: "Sales User",
      email: "sales@erp.com",
      passwordHash,
      role: "SALES",
      assignedLocationId: bangalore.id,
    },
  });
  const electronics = await prisma.category.upsert({
    where: {
      name: "Electronics",
    },
    update: {},
    create: {
      name: "Electronics",
    },
  });

  const laptop = await prisma.item.upsert({
    where: {
      sku: "LAP-001",
    },
    update: {},
    create: {
      sku: "LAP-001",
      name: "Business Laptop",
      description: "Standard business laptop",
      categoryId: electronics.id,
    },
  });

  const laptopBatch = await prisma.batch.upsert({
    where: {
      itemId_batchNumber: {
        itemId: laptop.id,
        batchNumber: "BATCH-001",
      },
    },
    update: {},
    create: {
      itemId: laptop.id,
      batchNumber: "BATCH-001",
    },
  });

  const monitor = await prisma.item.upsert({
    where: {
      sku: "MON-001",
    },
    update: {},
    create: {
      sku: "MON-001",
      name: "24-inch Monitor",
      description: "Full HD business monitor",
      categoryId: electronics.id,
    },
  });

  const monitorBatch = await prisma.batch.upsert({
    where: {
      itemId_batchNumber: {
        itemId: monitor.id,
        batchNumber: "BATCH-001",
      },
    },
    update: {},
    create: {
      itemId: monitor.id,
      batchNumber: "BATCH-001",
    },
  });
  const customer = await prisma.customer.upsert({
  where: {
    id: 1,
  },
  update: {},
  create: {
    name: "ABC Technologies",
    email: "contact@abctech.com",
    phone: "9876543210",
  },
});
const bangaloreLaptopInventory = await prisma.inventory.upsert({
  where: {
    itemId_locationId_batchId: {
      itemId: laptop.id,
      locationId: bangalore.id,
      batchId: laptopBatch.id,
    },
  },
  update: {
    physicalQuantity: 70,
    reservedQuantity: 0,
  },
  create: {
    itemId: laptop.id,
    locationId: bangalore.id,
    batchId: laptopBatch.id,
    physicalQuantity: 70,
    reservedQuantity: 0,
  },
});

const mumbaiLaptopInventory = await prisma.inventory.upsert({
  where: {
    itemId_locationId_batchId: {
      itemId: laptop.id,
      locationId: mumbai.id,
      batchId: laptopBatch.id,
    },
  },
  update: {
    physicalQuantity: 30,
    reservedQuantity: 0,
  },
  create: {
    itemId: laptop.id,
    locationId: mumbai.id,
    batchId: laptopBatch.id,
    physicalQuantity: 30,
    reservedQuantity: 0,
  },
});

console.log(
  `Bangalore Laptop Inventory: ${bangaloreLaptopInventory.physicalQuantity}`,
);
console.log(
  `Mumbai Laptop Inventory: ${mumbaiLaptopInventory.physicalQuantity}`,
);

    console.log("Seed completed successfully.");
  console.log("");
  console.log("Test accounts:");
  console.log("Admin      : admin@erp.com / Password@123");
  console.log("Operations : operations@erp.com / Password@123");
  console.log("Sales      : sales@erp.com / Password@123");
  console.log("");
  console.log(`Locations: ${bangalore.name}, ${mumbai.name}`);
  console.log(`Item: ${laptop.name} (${laptop.sku})`);
  console.log(`Laptop Batch ID: ${laptopBatch.id}`);
  console.log(`Monitor: ${monitor.name} (${monitor.sku})`);
console.log(`Customer: ${customer.name} (ID: ${customer.id})`); 
  console.log(`Monitor Batch ID: ${monitorBatch.id}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });