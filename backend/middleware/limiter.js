import { rateLimit } from "express-rate-limit"

// 100 requêtes max / 1sec
export const globalLimiter = rateLimit({
    limit: 100,
    windowMs: 1000,
    validate: {
        xForwardedForHeader: false, // To avoid warning on Vercel
        default: true,
    },
})

// 10 requêtes max / 5sec
export const authLimiter1 = rateLimit({
    limit: 10,
    windowMs: 5 * 1000,
    validate: {
        xForwardedForHeader: false,
        default: true,
    },
})

// 50 requêtes max / 30min
export const authLimiter2 = rateLimit({
    limit: 50,
    windowMs: 30 * 60 * 1000,
    validate: {
        xForwardedForHeader: false,
        default: true,
    },
})

// 5000 requêtes max / 1min
export const booksLimiter = rateLimit({
    limit: 5000,
    windowMs: 60 * 1000,
    validate: {
        xForwardedForHeader: false,
        default: true,
    },
})
