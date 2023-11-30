import serverless from "serverless-http"
import configureApp from "../../app.js"

const handlerCallback = async (event, context) => {
    const app = await configureApp()
    return serverless(app)(event, context)
}

export { handlerCallback as handler }