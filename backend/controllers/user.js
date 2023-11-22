import { hash, compare } from "bcrypt"
import { readFileSync } from "fs"
import "dotenv/config"
import jwt from "jsonwebtoken"
const { sign } = jwt
import User from "../models/user.js"

export async function signup(req, res) {
    try {
        const hashedPassword = await hash(req.body.password, parseInt(process.env.BCRYPT_SALT_ROUND))

        const user = new User({
            email: req.body.email,
            password: hashedPassword
        })

        await user.save()

        res.status(201).json({ message: "Utilisateur créé" })

    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
    }
}

export async function login(req, res) {
    try {
        const secret = readFileSync("./.certs/private.pem") // On encode le token avec la clé privée
        const user = await User.findOne({ email: req.body.email })

        if (!user) {
            res.status(401).json({ message: "Email ou mot de passe incorrect" })
            return
        }

        const valid = await compare(req.body.password, user.password)

        if (!valid) {
            res.status(401).json({ message: "Email ou mot de passe incorrect" })
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
        res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
    }
}