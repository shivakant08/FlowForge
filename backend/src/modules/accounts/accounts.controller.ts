import { Request, Response } from "express"
import { AccountsService } from "./accounts.service"
import { createAccountSchema } from "./accounts.schema"
import { success } from "zod"
import { authenticate } from "../../middleware/auth.middleware"
import { AuthService } from "../auth/auth.service"

const accountsService = new AccountsService()

export class AccountsController {
    async create(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const validated = createAccountSchema.parse(req.body)
            const account = await accountsService.createAccount(organizationId, validated)
            return res.status(201).json({ success: true, data: account })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }

    }

    async list(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId
            const accounts = await accountsService.getAccountsByOrganization(organizationId)
            return res.status(200).json({ success: true, data: accounts })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }

    


    async seedDefault(req: Request, res: Response) {
        try {
            const organizationId = req.user!.organizationId;
            const accounts = await accountsService.seedDefaultChartOfAccounts(organizationId);
            return res.status(201).json({ success: true, data: accounts });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

}