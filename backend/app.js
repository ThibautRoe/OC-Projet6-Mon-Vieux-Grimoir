import express from "express"
import { connect } from "mongoose"
import "dotenv/config"
import * as path from "path"
import { fileURLToPath } from "url"
import userRoutes from "./routes/user.js"
import bookRoutes from "./routes/book.js"

const fileName = fileURLToPath(import.meta.url)
const dirPath = path.dirname(fileName)

export default async function configureApp() {
    if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST) {
        console.error("Les variables d'environnement DB_USER, DB_PASS et DB_HOST doivent être définies.")
        process.exit(1)
    }

    try {
        await connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`)
        console.log("Connexion à MongoDB réussie !")

        const app = express()

        app.use((req, res, next) => {
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization")
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
            next()
        })

        app.use(express.json())

        app.use("/api/auth", userRoutes)
        app.use("/api/books", bookRoutes)
        app.use("/images", express.static(path.join(dirPath, "images")))

        return app
    } catch (err) {
        console.error("Connexion à MongoDB échouée !")
        throw err
    }
}