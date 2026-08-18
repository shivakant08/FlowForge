import { Request, Response } from "express";
import { ReconciliationService } from "./reconciliation.service";


const reconciliationService = new ReconciliationService()

export class ReconciliationController{
    async importStatement(req: Request, res: Response){
        try {
            const organizationId = req.user!.organizationId
            const {filename, items} = req.body

            const result = await reconciliationService.processSatement(organizationId, filename, items)
            return res.status(201).json({success: true, data: result})
        } catch (error: any) {
           return res.status(400).json({success:false, error:error.message}) 
        }
    }
}