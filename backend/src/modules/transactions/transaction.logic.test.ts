import { isBalancedTransaction } from "./transaction.logic"

describe("double-entry balancing", () => {
    it("accepts equal debit and credit totals", () => {
        expect(isBalancedTransaction([
            { entryType: "DEBIT", amount: 100 },
            { entryType: "CREDIT", amount: 100 },
        ])).toBe(true)
    })

    it("rejects unequal totals", () => {
        expect(isBalancedTransaction([
            { entryType: "DEBIT", amount: 100 },
            { entryType: "CREDIT", amount: 99.99 },
        ])).toBe(false)
    })
})