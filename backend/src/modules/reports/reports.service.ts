import { prisma } from "../../config/database"
import { buildFinancialReports, buildTrialBalance, ReportAccount } from "./reports.logic"

export class ReportsService {
    async getReports(organizationId: string) {
        const [accounts, entries] = await Promise.all([
            prisma.account.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
            prisma.ledgerEntry.findMany({ where: { account: { organizationId } } }),
        ])

        const reportAccounts: ReportAccount[] = accounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: Number(account.balance),
        }))
        const debitTotals = new Map<string, number>()
        const creditTotals = new Map<string, number>()

        for (const entry of entries) {
            const totals = entry.entryType === "DEBIT" ? debitTotals : creditTotals
            totals.set(entry.accountId, (totals.get(entry.accountId) ?? 0) + Number(entry.amount))
        }

        return {
            generatedAt: new Date().toISOString(),
            ...buildFinancialReports(reportAccounts),
            trialBalance: buildTrialBalance(reportAccounts, debitTotals, creditTotals),
        }
    }
}