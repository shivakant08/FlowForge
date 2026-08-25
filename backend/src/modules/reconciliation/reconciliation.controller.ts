import { Request, Response } from "express";
import { ReconciliationService } from "./reconciliation.service";
import { success } from "zod";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import crypto from "crypto";


const reconciliationService = new ReconciliationService()

const bankStatementRowSchema = z.object({
    transactionDate: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
    description: z.string().trim().min(1),
    amount: z.coerce.number().finite().positive(),
    referenceNo: z.string().trim().optional(),
})

const importSchema = z.object({
    filename: z.string().trim().min(1).max(255),
    items: z.array(bankStatementRowSchema).min(1, "Statement must contain at least one row."),
})

export class ReconciliationController {
    async importStatement(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            let { filename, items } = req.body
            let fileHash: string | undefined

            if (req.file) {
                filename = req.file.originalname
                fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex")
                const records = parse(req.file.buffer, {
                    columns: true,
                    skip_empty_lines: true,
                    bom: true,
                    trim: true,
                }) as Record<string, string>[]

                const requiredHeaders = ["transactionDate", "description", "amount"]
                const headers = Object.keys(records[0] ?? {})
                const hasRequiredHeaders = requiredHeaders.every((header) => headers.includes(header))
                if (!hasRequiredHeaders) {
                    throw new Error("CSV must contain transactionDate, description, and amount headers.")
                }
                items = records
            }

            const validated = importSchema.parse({ filename, items })
            const duplicate = typeof reconciliationService.hasStatement === "function"
                ? await reconciliationService.hasStatement(organizationId, validated.filename, fileHash)
                : false
            if (duplicate) {
                return res.status(409).json({ success: false, error: "This statement has already been imported." })
            }

            const result = req.file
                ? await reconciliationService.processSatement(organizationId, validated.filename, validated.items, fileHash)
                : await reconciliationService.processSatement(organizationId, validated.filename, validated.items)
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