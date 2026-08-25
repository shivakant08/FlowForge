export type ReportAccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"

export interface ReportAccount {
    id: string
    name: string
    type: ReportAccountType
    balance: number
}

export interface TrialBalanceLine extends ReportAccount {
    debit: number
    credit: number
}

export function buildFinancialReports(accounts: ReportAccount[]) {
    const balanceSheet = {
        assets: accounts.filter((account) => account.type === "ASSET"),
        liabilities: accounts.filter((account) => account.type === "LIABILITY"),
        equity: accounts.filter((account) => account.type === "EQUITY"),
    }

    const profitAndLoss = {
        revenue: accounts.filter((account) => account.type === "REVENUE"),
        expenses: accounts.filter((account) => account.type === "EXPENSE"),
    }

    const total = (lines: ReportAccount[]) => lines.reduce((sum, line) => sum + line.balance, 0)
    const totalRevenue = total(profitAndLoss.revenue)
    const totalExpenses = total(profitAndLoss.expenses)

    return {
        balanceSheet: {
            ...balanceSheet,
            totalAssets: total(balanceSheet.assets),
            totalLiabilities: total(balanceSheet.liabilities),
            totalEquity: total(balanceSheet.equity),
        },
        profitAndLoss: {
            ...profitAndLoss,
            totalRevenue,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses,
        },
    }
}

export function buildTrialBalance(accounts: ReportAccount[], debitTotals: Map<string, number>, creditTotals: Map<string, number>) {
    const lines: TrialBalanceLine[] = accounts.map((account) => ({
        ...account,
        debit: debitTotals.get(account.id) ?? 0,
        credit: creditTotals.get(account.id) ?? 0,
    }))

    return {
        lines,
        totalDebits: lines.reduce((sum, line) => sum + line.debit, 0),
        totalCredits: lines.reduce((sum, line) => sum + line.credit, 0),
    }
}