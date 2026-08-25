import { buildFinancialReports, buildTrialBalance } from "./reports.logic"

const accounts = [
    { id: "asset", name: "Cash", type: "ASSET" as const, balance: 1000 },
    { id: "liability", name: "Payable", type: "LIABILITY" as const, balance: 300 },
    { id: "equity", name: "Equity", type: "EQUITY" as const, balance: 200 },
    { id: "revenue", name: "Sales", type: "REVENUE" as const, balance: 800 },
    { id: "expense", name: "Rent", type: "EXPENSE" as const, balance: 250 },
]

describe("financial reports", () => {
    it("calculates balance sheet and income statement totals", () => {
        const reports = buildFinancialReports(accounts)

        expect(reports.balanceSheet.totalAssets).toBe(1000)
        expect(reports.balanceSheet.totalLiabilities).toBe(300)
        expect(reports.profitAndLoss.totalRevenue).toBe(800)
        expect(reports.profitAndLoss.totalExpenses).toBe(250)
        expect(reports.profitAndLoss.netIncome).toBe(550)
    })

    it("aggregates debits and credits for every account", () => {
        const trialBalance = buildTrialBalance(
            accounts,
            new Map([["asset", 1000], ["expense", 250]]),
            new Map([["liability", 300], ["equity", 200], ["revenue", 750]])
        )

        expect(trialBalance.totalDebits).toBe(1250)
        expect(trialBalance.totalCredits).toBe(1250)
    })
})