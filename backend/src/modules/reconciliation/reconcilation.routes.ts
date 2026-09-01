import { Router, Request, Response } from "express";
import { ReconciliationController } from "./reconciliation.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import multer from "multer";
import { importRateLimit } from "../../middleware/rate-limit.middleware";

const router = Router()
const controller = new ReconciliationController()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
})

router.use(authenticate)
router.post("/import", importRateLimit, upload.single("statement"), requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req, res)=>controller.importStatement(req, res))
router.get("/statements", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.getStatements(req, res))
router.get("/statements/:id", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req:Request<{id:string}>, res:Response)=>controller.getStatementDetails(req, res))
router.get("/items/:id/match", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req:Request<{id:string}>, res:Response)=>controller.manualMatch(req, res))


export default router