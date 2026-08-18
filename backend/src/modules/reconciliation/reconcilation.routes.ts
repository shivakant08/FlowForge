import { Router } from "express";
import { ReconciliationController } from "./reconciliation.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";

const router = Router()
const controller = new ReconciliationController()

router.use(authenticate)
router.post("/import", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req, res)=>controller.importStatement(req, res))

export default router