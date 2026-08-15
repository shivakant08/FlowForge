import { Router } from "express";
import { TransactionController } from "./transactions.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";

const router = Router()
const controller = new TransactionController()

router.use(authenticate)

router.get("/", (req, res)=>controller.list(req, res))
router.post("/", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.create(req, res))

export default router