import serverless from "serverless-http"
import configureApp from "../../app.js"

const api = await configureApp()
export const handler = serverless(api)