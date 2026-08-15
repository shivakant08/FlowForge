import { z } from "zod";

const ledgerEntryItemSchema = z.object({
    accountId: z.string().uuid("Invalid account ID format"),
    entryType: z.enum(["DEBIT", "CREDIT"]),
    amount: z.number().positive("Amount must be greater than zero")
})

export const createTransactionSchema = z.object({
    description: z.string().trim().min(3, "Description is required"),
    currency: z.string().length(3).default("INR"),
    entries: z.array(ledgerEntryItemSchema)
    .min(2, "A double-entry transaction requires at least two line items")
})
.refine(
    (data)=>{
        const totalDebits = data.entries.filter((e)=>e.entryType === "DEBIT").reduce((sum, e)=> sum + e.amount, 0)
        const totalCredits = data.entries.filter((e)=>e.entryType === "CREDIT").reduce((sum, e)=> sum + e.amount, 0)
        return Math.abs(totalDebits - totalCredits) < 0.0001
    },
    {
        message:"Unbalanced Transaction: Sum of Debits must equal Sum of Credits",
        path:["entries"]
    }
)

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>