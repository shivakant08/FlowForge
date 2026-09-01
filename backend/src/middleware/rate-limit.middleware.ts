import rateLimit from "express-rate-limit"

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many authentication attempts. Please try again later." },
})

export const importRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many statement imports. Please try again later." },
})