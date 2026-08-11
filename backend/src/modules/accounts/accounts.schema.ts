import {z} from "zod"

export const createAccountSchema = z.object({
    name:z.string().trim().min(2, "Account name is required"),
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    currency: z.string().length(3).default("INR")
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>