import { Request, Response } from "express"
import { AnalyticsService } from "./analytics.service"
const analyticsService = new AnalyticsService()

export class AnalyticsController {
    async getMonthlyAnalytics(req: Request, res: Response) {
        try {
            const data = await analyticsService.getMonthlyAnalytics(req.user!.organizationId)
            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }

    async getCashFlowSummary(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

            const data = await analyticsService.getCashFlowSummary(organizationId, startDate, endDate)
            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message })
        }
    }
}