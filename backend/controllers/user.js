import { hash, compare } from "bcrypt"
import { readFileSync } from "fs"
import "dotenv/config"
import { RES_MESSAGES } from "../variables.js"
import User from "../models/user.js"
import jwt from "jsonwebtoken"

const { sign } = jwt

/**
 * Fonction permettant de créer un nouvel utilisateur dans la DB
 * @async
 * @function signup
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
export async function signup(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) { return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY }) }

        const hashedPassword = await hash(req.body.password, parseInt(process.env.BCRYPT_SALT_ROUND))

        const user = new User({
            email: req.body.email,
            password: hashedPassword
        })

        await user.save()

        return res.status(201).json({ message: RES_MESSAGES.USER_CREATED })

    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant de vérifier si un utilisateur existe dans la DB et si oui, de lui retourner un token JWT
 * @async
 * @function login
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
export async function login(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) { return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY }) }

        const secret = readFileSync(process.env.SSH_KEY_PRIVATE) // On encode le token avec la clé privée
        const user = await User.findOne({ email: req.body.email })

        if (!user) { return res.status(400).json({ message: RES_MESSAGES.INVALID_USER }) }

        const valid = await compare(req.body.password, user.password)

        if (!valid) { return res.status(400).json({ message: RES_MESSAGES.INVALID_USER }) }

        return res.status(200).json({
            userId: user._id,
            token: sign(
                { userId: user._id },
                secret,
                { expiresIn: process.env.JWT_EXPIRE, algorithm: "RS256" }
            )
        })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}