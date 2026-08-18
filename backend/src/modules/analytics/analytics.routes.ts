import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router()
const controller = new AnalyticsController()

router.use(authenticate)

router.get("/cash-flow", (req, res)=> controller.getCashFlowSummary(req, res))

export default router