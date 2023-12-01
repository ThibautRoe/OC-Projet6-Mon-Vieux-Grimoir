import { rateLimit } from "express-rate-limit"
import { RES_MESSAGES } from "../constants.js"

// 5 requêtes max / 1sec
export const globalLimiter = rateLimit({
    windowMs: 1000,
    limit: 5,
    message: RES_MESSAGES.RATE_LIMIT
})

// 10 requêtes max / 1min
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: RES_MESSAGES.RATE_LIMIT
})

// 100 requêtes max / 1min
export const booksLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    message: RES_MESSAGES.RATE_LIMIT
})