import * as path from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"
import configureApp from "../app.js"

const fileName = fileURLToPath(import.meta.url)
const dirPath = path.dirname(fileName)
const swaggerPath = path.join(dirPath, "../swagger.json")
const swaggerDocument = JSON.parse(readFileSync(swaggerPath))

const app = await configureApp(dirPath, swaggerDocument)

export default app
