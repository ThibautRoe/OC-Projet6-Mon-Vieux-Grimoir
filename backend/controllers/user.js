import { hash, compare } from "bcrypt"
import { readFileSync } from "fs"
import "dotenv/config"
import { ERROR_MESSAGES, RES_MESSAGES } from "../variables.js"
import User from "../models/user.js"
import jwt from "jsonwebtoken"

const { sign } = jwt

export async function signup(req, res) {
    try {
        const hashedPassword = await hash(req.body.password, parseInt(process.env.BCRYPT_SALT_ROUND))

        const user = new User({
            email: req.body.email,
            password: hashedPassword
        })

        await user.save()

        res.status(201).json({ message: RES_MESSAGES.USER_CREATED })

    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}

export async function login(req, res) {
    try {
        const secret = readFileSync(process.env.SSH_KEY_PRIVATE) // On encode le token avec la clé privée
        const user = await User.findOne({ email: req.body.email })

        if (!user) {
            res.status(401).json({ message: RES_MESSAGES.INVALID_USER })
            return
        }

        const valid = await compare(req.body.password, user.password)

        if (!valid) {
            res.status(401).json({ message: RES_MESSAGES.INVALID_USER })
            return
        }

        res.status(200).json({
            userId: user._id,
            token: sign(
                { userId: user._id },
                secret,
                { expiresIn: process.env.JWT_EXPIRE, algorithm: "RS256" }
            )
        })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}