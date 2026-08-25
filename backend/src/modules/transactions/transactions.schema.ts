import { z } from "zod";
import { isBalancedTransaction } from "./transaction.logic";

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
        return isBalancedTransaction(data.entries)
    },
    {
        message:"Unbalanced Transaction: Sum of Debits must equal Sum of Credits",
        path:["entries"]
    }
)

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>