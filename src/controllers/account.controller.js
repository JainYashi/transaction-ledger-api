import { createAccount,getAccountBalance } from "../services/account.service.js";

export async function handleCreateAccount(req, res, next) {
  try {
    const { name } = req.body;

    const account = await createAccount(name);

    return res.status(201).json({
      status: "success",
      data: account,
    });
  } catch (error) {
    next(error);
  }
}
export async function handleGetAccountBalance(req, res, next) {
  try {
    const { accountId } = req.params;

    const account = await getAccountBalance(accountId);

    if (!account) {
      return res.status(404).json({
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found.",
        },
      });
    }

    return res.status(200).json({
      account_id: account.id,
      balance: account.balance,
    });
  } catch (error) {
    next(error);
  }
}