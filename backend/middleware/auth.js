import { RES_MESSAGES } from "../constants.js"
import jwt from "jsonwebtoken"

const { verify } = jwt

export default (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: RES_MESSAGES.MISSING_JWT_TOKEN })
    }

    try {
        const secret = process.env.SSH_KEY_PUBLIC
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = verify(token, secret) // On vérifie avec la clé publique
        const userId = decodedToken.userId
        req.auth = {
            userId: userId,
        }

        next()
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}
