import { buildMonthlyAnalytics } from "./analytics.logic"

describe("monthly analytics", () => {
    it("aggregates income, expenses, and cash movement by month", () => {
        const data = buildMonthlyAnalytics([
            { createdAt: new Date("2026-08-05"), amount: 1000, entryType: "CREDIT", accountType: "REVENUE" },
            { createdAt: new Date("2026-08-10"), amount: 200, entryType: "DEBIT", accountType: "EXPENSE" },
            { createdAt: new Date("2026-08-15"), amount: 800, entryType: "DEBIT", accountType: "ASSET" },
        ], 1, new Date("2026-08-20"))

        expect(data).toEqual([{ month: "2026-08", income: 1000, expenses: 200, netCashFlow: 1600 }])
    })

    it("includes zero-filled months with no activity", () => {
        expect(buildMonthlyAnalytics([], 2, new Date("2026-08-20"))).toEqual([
            { month: "2026-07", income: 0, expenses: 0, netCashFlow: 0 },
            { month: "2026-08", income: 0, expenses: 0, netCashFlow: 0 },
        ])
    })
})