import { Request, Response } from "express"
import { ReportsService } from "./reports.service"

const reportsService = new ReportsService()

export class ReportsController {
    async getReports(req: Request, res: Response) {
        try {
            const data = await reportsService.getReports(req.user!.organizationId)
            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }

    async getBalanceSheet(req: Request, res: Response) {
        const response = await this.getReports(req, res)
        return response
    }

    async getProfitAndLoss(req: Request, res: Response) {
        const response = await this.getReports(req, res)
        return response
    }

    async getTrialBalance(req: Request, res: Response) {
        const response = await this.getReports(req, res)
        return response
    }
}