export interface AnalyticsEntry {
    createdAt: Date
    amount: number
    entryType: "DEBIT" | "CREDIT"
    accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
}

export interface MonthlyAnalytics {
    month: string
    income: number
    expenses: number
    netCashFlow: number
}

export function buildMonthlyAnalytics(entries: AnalyticsEntry[], monthCount = 12, now = new Date()) {
    const months: MonthlyAnalytics[] = []
    const monthMap = new Map<string, MonthlyAnalytics>()

    for (let offset = monthCount - 1; offset >= 0; offset--) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const row = { month, income: 0, expenses: 0, netCashFlow: 0 }
        months.push(row)
        monthMap.set(month, row)
    }

    for (const entry of entries) {
        const month = `${entry.createdAt.getFullYear()}-${String(entry.createdAt.getMonth() + 1).padStart(2, "0")}`
        const row = monthMap.get(month)
        if (!row) continue

        const amount = entry.amount
        const isDebit = entry.entryType === "DEBIT"
        if (entry.accountType === "REVENUE" && !isDebit) row.income += amount
        if (entry.accountType === "EXPENSE" && isDebit) row.expenses += amount
        if (entry.accountType === "ASSET") row.netCashFlow += isDebit ? amount : -amount
    }

    for (const row of months) row.netCashFlow += row.income - row.expenses
    return months
}