import {Request, Response} from "express"
import { TransactionsService } from "./transactions.service"
import { createTransactionSchema } from "./transactions.schema"
import { success } from "zod"

const transactionsService = new TransactionsService()

export class TransactionController{
    async create(req: Request, res: Response){
        try {
            const organizationId = req.user!.organizationId
            const userId = req.user!.userId
            const validated = createTransactionSchema.parse(req.body)

            const transaction = await transactionsService.createTransaction(
                organizationId, userId, validated
            )

            return res.status(201).json({success: true, data: transaction})
        } catch (error:any) {
            return res.status(400).json({success: false, error: error.message})
        }
    }

    async list(req: Request, res: Response){
        try {
            const organizationId = req.user!.organizationId
            const transactions = await transactionsService.getTransaction(organizationId)
            return res.status(200).json({success: true, data: transactions})
        } catch (error: any) {
            return res.status(500).json({success: false, error: error.message})
        }
    }
}