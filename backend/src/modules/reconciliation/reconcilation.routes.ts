import { Router, Request, Response } from "express";
import { ReconciliationController } from "./reconciliation.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";

const router = Router()
const controller = new ReconciliationController()

router.use(authenticate)
router.post("/import", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req, res)=>controller.importStatement(req, res))
router.get("/statements", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req, res)=>controller.getStatements(req, res))
router.get("/statements/:id", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]), (req:Request<{id:string}>, res:Response)=>controller.getStatementDetails(req, res))
router.get("/items/:id/match", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req:Request<{id:string}>, res:Response)=>controller.manualMatch(req, res))


export default router