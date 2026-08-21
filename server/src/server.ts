import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./auth/auth.routes.js";
import inventoryRoutes from "./inventory/inventory.routes.js";
import workOrderRoutes from "./workorders/workorder.routes.js";
import transferRoutes from "./transfers/transfer.routes.js";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Mini Operations ERP API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/transfers", transferRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(env.PORT, () => {
  console.log(`Mini Operations ERP API running on port ${env.PORT}`);
});
