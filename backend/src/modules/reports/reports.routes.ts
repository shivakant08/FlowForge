import { Router } from "express"
import { authenticate } from "../../middleware/auth.middleware"
import { ReportsController } from "./reports.controller"

const router = Router()
const controller = new ReportsController()

router.use(authenticate)
router.get("/", (req, res) => controller.getReports(req, res))
router.get("/balance-sheet", (req, res) => controller.getBalanceSheet(req, res))
router.get("/profit-and-loss", (req, res) => controller.getProfitAndLoss(req, res))
router.get("/trial-balance", (req, res) => controller.getTrialBalance(req, res))

export default router