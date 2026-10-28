import { Router } from "express";
import { handleCreateAccount , handleGetAccountBalance,} from "../controllers/account.controller.js";
import { handleCreateTransaction,handleGetTransactionHistory } from "../controllers/transaction.controller.js";
import { validateCreateAccount } from "../middleware/validate-account.js";
import { validateAccountId } from "../middleware/validate-uuid.js";
import { validateCreateTransaction } from "../middleware/validate-transaction.js";
import { validateTransactionHistory } from "../middleware/validate-transaction-history.js";

const router = Router();

router.post("/", validateCreateAccount, handleCreateAccount);
router.get("/:accountId/balance", validateAccountId, handleGetAccountBalance);
router.post(
  "/:accountId/transactions",
  validateAccountId,
  validateCreateTransaction,
  handleCreateTransaction
);
router.get(
  "/:accountId/transactions",
  validateAccountId,
  validateTransactionHistory,
  handleGetTransactionHistory
);


export default router;