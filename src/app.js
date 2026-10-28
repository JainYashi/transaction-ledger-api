import express from "express";
import accountRoutes from "./routes/account.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
const app = express();

// Parse incoming JSON request bodies
app.use(express.json());
app.use("/accounts", accountRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Transaction Ledger API is running.",
  });
});
app.use("/transfers", transferRoutes);
app.use(errorHandler);

export default app;