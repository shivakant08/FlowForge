import { Router , Request, Response} from "express";
import { TransactionController } from "./transactions.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import {enforceIdempotency} from "../../middleware/idempotency.middleware"

const router = Router()
const controller = new TransactionController()

// router.use(authenticate)

router.get("/", (req, res)=>controller.list(req, res))
router.post("/", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.create(req, res))

router.post("/submit", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.submitForApproval(req, res))
router.post("/:id/approve", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]),enforceIdempotency, (req:Request<{id: string}>, res:Response)=>controller.approve(req, res))
router.post("/:id/reject", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.reject(req, res))


export default router