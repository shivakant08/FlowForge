import { findMatchingLedgerEntry } from "./matching.logic"

describe("reconciliation matching", () => {
    it("matches the first available ledger entry by amount", () => {
        const match = findMatchingLedgerEntry([
            { id: "other", amount: "50.00" },
            { id: "match", amount: "125.00" },
        ], 125)

        expect(match).toEqual({ id: "match", amount: "125.00" })
    })

    it("returns no match for a different amount", () => {
        expect(findMatchingLedgerEntry([{ id: "other", amount: 50 }], 125)).toBeUndefined()
    })

    it("prefers matching descriptions within a three-day date window", () => {
        const match = findMatchingLedgerEntry([
            { id: "wrong", amount: 125, createdAt: new Date("2026-08-01"), transaction: { description: "Office supplies" } },
            { id: "match", amount: 125, createdAt: new Date("2026-08-19"), transaction: { description: "Acme invoice INV-42" } },
        ], {
            amount: 125,
            transactionDate: new Date("2026-08-18"),
            description: "Acme invoice payment",
            referenceNo: "INV-42",
        })

        expect(match?.id).toBe("match")
    })

    it("rejects an exact amount outside the date window", () => {
        expect(findMatchingLedgerEntry([
            { id: "late", amount: 125, createdAt: new Date("2026-08-30") },
        ], {
            amount: 125,
            transactionDate: new Date("2026-08-18"),
        })).toBeUndefined()
    })
})