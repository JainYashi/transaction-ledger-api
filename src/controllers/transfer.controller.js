import { transferMoney } from "../services/transfer.service.js";

export async function handleTransfer(req, res, next) {
  try {
    const result = await transferMoney(req.body);

    return res.status(201).json({
      status: "success",
      message: "Transfer completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}