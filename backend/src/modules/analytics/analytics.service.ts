import { gte, lte } from "zod"
import { prisma } from "../../config/database"


export class AnalyticsService {
    async getCashFlowSummary(organizationId: string, startDate?: Date, endDate?: Date) {
        const dateFilter = {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
        }

        const entries = await prisma.ledgerEntry.findMany({
            where: {
                account: { organizationId },
                createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
            include: { account: true }
        })

        let totalInflow = 0;
        let totalOutFlow = 0;

        for (const entry of entries) {
            const amount = Number(entry.amount)
            const isDebit = entry.entryType === "DEBIT"

            if (entry.account.type === "REVENUE") {
                if (!isDebit) totalInflow += amount
            } else if (entry.account.type === "EXPENSE") {
                if (isDebit) totalOutFlow += amount
            } else if (entry.account.type === "ASSET") {
                if (isDebit) totalInflow += amount
                else totalOutFlow += amount
            }
        }

        const netCashFlow = totalInflow - totalOutFlow

        return {
            period: {
                startDate: startDate || "ALL_TIME",
                endDate: endDate || "ALL_TIME"
            },
            summary: {
                totalInflow,
                totalOutFlow,
                netCashFlow,
                burnRate: totalOutFlow
            }
        }
    }
}