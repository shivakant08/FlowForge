import { Request, Response } from "express"
import { TransactionsService } from "./transactions.service"
import { createTransactionSchema } from "./transactions.schema"


const transactionsService = new TransactionsService()

export class TransactionController {
    async create(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const userId = req.user!.userId
            const validated = createTransactionSchema.parse(req.body)

            const transaction = await transactionsService.createTransaction(
                organizationId, userId, validated, req.user!.role
            )

            return res.status(201).json({ success: true, data: transaction })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async list(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const transactions = await transactionsService.getTransaction(organizationId)
            return res.status(200).json({ success: true, data: transactions })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }

    async submitForApproval(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const userId = req.user!.userId
            const { description, amount, currency } = req.body

            const transaction = await transactionsService.submitApproval(organizationId, userId, { description, amount, currency })
            return res.status(201).json({ success: true, data: transaction })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async approve(req: Request<{id:string}>, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const approverId = req.user!.userId
            const { id } = req.params
            const { entries } = req.body
            const idempotencyKey = (req as any).idempotencyKey

            const result = await transactionsService.approveTransaction(organizationId, approverId, id, entries, idempotencyKey)
            return res.status(200).json({ success: true, data: result })
        } catch (error: any) {
            return res.status(400).json({
                success: false, error: error.message
            })
        }
    }

    async reject(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const { id } = req.params as {id: string};

      const result = await transactionsService.rejectTransaction(
        organizationId,
        userId,
        id
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}