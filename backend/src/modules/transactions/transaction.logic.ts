export interface LedgerLine {
    entryType: "DEBIT" | "CREDIT"
    amount: number
}

export function isBalancedTransaction(entries: LedgerLine[]) {
    const debits = entries.filter((entry) => entry.entryType === "DEBIT")
        .reduce((sum, entry) => sum + entry.amount, 0)
    const credits = entries.filter((entry) => entry.entryType === "CREDIT")
        .reduce((sum, entry) => sum + entry.amount, 0)

    return Math.abs(debits - credits) < 0.0001
}