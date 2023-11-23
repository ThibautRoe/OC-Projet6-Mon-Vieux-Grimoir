import { readFileSync } from "fs"
import "dotenv/config"
import jwt from "jsonwebtoken"
const { verify } = jwt

export default (req, res, next) => {
    try {
        const secret = readFileSync(process.env.SSH_KEY_PUBLIC) // On vérifie avec la clé publique
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = verify(token, secret)
        const userId = decodedToken.userId
        req.auth = {
            userId: userId
        }
        next()
    } catch (error) {
        res.status(401).json({ error })
    }
}