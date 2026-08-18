import { Request, Response } from "express";
import { ReconciliationService } from "./reconciliation.service";
import { success } from "zod";


const reconciliationService = new ReconciliationService()

export class ReconciliationController {
    async importStatement(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const { filename, items } = req.body

            const result = await reconciliationService.processSatement(organizationId, filename, items)
            return res.status(201).json({ success: true, data: result })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async getStatements(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const data = await reconciliationService.getStatements(organizationId)
            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async getStatementDetails(req: Request<{id:string}>, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const { id } = req.params
            const data = await reconciliationService.getStatementDetails(organizationId, id)

            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async manualMatch(req: Request<{id:string}>, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const { id } = req.params
            const { ledgerEntryId } = req.body

            const data = await reconciliationService.manualMatch(organizationId, id, ledgerEntryId)
            return res.status(200).json({ success: true, data })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }
}