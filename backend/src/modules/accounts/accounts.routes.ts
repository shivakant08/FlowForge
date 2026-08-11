import { Router } from "express";
import { AccountsController } from "./accounts.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";

const router = Router()
const controller = new AccountsController()

router.use(authenticate)

router.get("/", (req, res)=>controller.list(req, res))
router.post("/", requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT"]), (req, res)=>controller.create(req, res))
router.post("/seed-defaults", requireRole(["ORG_ADMIN"]), (req, res)=>controller.seedDefault(req, res))

export default router