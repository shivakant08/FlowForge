import {z} from "zod"

export const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(8, "Password must be at leat 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password Password must contain at least one special character"),
    organizationName : z.string().trim().min(2, "Organization name must be at leat 2 characters")
    
})

export const refreshSchema = z.object({
    refreshToken : z.string().min(1, "Refresh token is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type RefreshInput = z.infer<typeof refreshSchema>