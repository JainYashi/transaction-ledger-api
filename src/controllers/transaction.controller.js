import { createTransaction,getTransactionHistory, } from "../services/transaction.service.js";

export async function handleCreateTransaction(req, res, next) {
  try {
    const { accountId } = req.params;

    const result = await createTransaction(accountId, req.body);

    return res.status(201).json({
      status: "success",
      data: result.transaction,
      balance: result.balance,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetTransactionHistory(req, res, next) {
  try {
    const { accountId } = req.params;

    const type = req.query.type || null;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const result = await getTransactionHistory(accountId, {
      type,
      page,
      limit,
    });

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}