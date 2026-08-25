export interface MatchableLedgerEntry {
    id: string
    amount: unknown
    createdAt?: Date
    transaction?: { description?: string | null; createdAt?: Date }
}

export interface BankStatementMatchInput {
    amount: number
    transactionDate?: Date
    description?: string
    referenceNo?: string
}

const normalize = (value: string | null | undefined) =>
    (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const similarity = (left: string, right: string) => {
    const leftWords = new Set(normalize(left).split(" ").filter(Boolean))
    const rightWords = new Set(normalize(right).split(" ").filter(Boolean))
    if (!leftWords.size || !rightWords.size) return 0

    const overlap = [...leftWords].filter((word) => rightWords.has(word)).length
    return overlap / Math.max(leftWords.size, rightWords.size)
}

const daysBetween = (left: Date, right: Date) =>
    Math.abs(left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24)

export function findMatchingLedgerEntry<T extends MatchableLedgerEntry>(entries: T[], input: number | BankStatementMatchInput) {
    const matchInput: BankStatementMatchInput = typeof input === "number" ? { amount: input } : input

    return entries
        .map((entry) => {
            if (Math.abs(Number(entry.amount) - matchInput.amount) >= 0.0001) return { entry, score: -1 }

            const entryDate = entry.transaction?.createdAt ?? entry.createdAt
            const dateScore = matchInput.transactionDate && entryDate
                ? daysBetween(matchInput.transactionDate, entryDate) <= 3 ? 0.2 : -1
                : 0
            if (dateScore < 0) return { entry, score: -1 }

            const entryDescription = entry.transaction?.description ?? ""
            const descriptionScore = matchInput.description ? similarity(matchInput.description, entryDescription) * 0.3 : 0
            const referenceScore = matchInput.referenceNo && normalize(entryDescription).includes(normalize(matchInput.referenceNo)) ? 0.5 : 0

            return { entry, score: 0.5 + dateScore + descriptionScore + referenceScore }
        })
        .filter((candidate) => candidate.score >= 0.5)
        .sort((left, right) => right.score - left.score)[0]?.entry
}