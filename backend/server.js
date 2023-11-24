import "dotenv/config"
import { createServer } from "http"
import configureApp from "./app.js"

function normalizePort(val) {
    const port = parseInt(val, 10)
    return isNaN(port) ? val : port >= 0 ? port : false
}

const port = normalizePort(process.env.SERVER_PORT || "4000")

function errorHandler(error, server) {
    if (error.syscall !== "listen") {
        throw error
    }
    const address = server.address()
    const bind = typeof address === "string" ? `Pipe ${address}` : `Port ${port}`

    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges.")
            process.exit(1)
            break
        case "EADDRINUSE":
            console.error(bind + " is already in use.")
            process.exit(1)
            break
        default:
            throw error
    }
}

async function startServer() {
    try {
        const app = await configureApp()
        app.set("port", port)
        const server = createServer(app)
        server.on("error", error => errorHandler(error, server))
        server.on("listening", () => {
            const address = server.address()
            const bind = typeof address === "string" ? `Pipe ${address}` : `Port ${port}`
            console.log("Listening on " + bind)
        })

        server.listen(port)
    } catch (err) {
        console.error("Une erreur est survenue lors de la configuration de l'application. ", err.message)
        process.exit(1)
    }
}

startServer()