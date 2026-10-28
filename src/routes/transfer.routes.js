import { Router } from "express";
import { handleTransfer } from "../controllers/transfer.controller.js";
import { validateTransfer } from "../middleware/validate-transfer.js";

const router = Router();

router.post("/", validateTransfer, handleTransfer);

export default router;