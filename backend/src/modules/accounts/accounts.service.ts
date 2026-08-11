import { prisma } from "../../config/database"
import { CreateAccountInput } from "./accounts.schema"

export class AccountsService {
    async createAccount(organizationId: string, input: CreateAccountInput) {
        return await prisma.account.create({
            data: {
                organizationId,
                name: input.name,
                type: input.type,
                currency: input.currency,
                balance: 0
            }
        })
    }

    async getAccountsByOrganization(organizationId: string) {
        return await prisma.account.findMany({
            where: { organizationId },
            orderBy: { name: "asc" }
        })
    }

    async seedDefaultChartOfAccounts(organizationId: string) {
        const defaultAccounts = [
            { name: "Operating Cash", type: "ASSET" },
            { name: "Accounts Receivable", type: "ASSET" },
            { name: "Accounts Payable", type: "LIABILITY" },
            { name: "Common Stock / Equity", type: "EQUITY" },
            { name: "Operating Revenue", type: "REVENUE" },
            { name: "Operating Expenses", type: "EXPENSE" },
        ];

        return await prisma.$transaction(
            defaultAccounts.map((account)=>
            prisma.account.create({
                data:{
                    organizationId,
                    name:account.name,
                    type: account.type as any,
                    currency: "INR",
                    balance: 0
                }
            }))
        )
    }
}