/*
     eslint-disable react/jsx-filename-extension
*/
import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import reportWebVitals from "./reportWebVitals"

import { API_ROUTES } from "./utils/constants"

console.log(API_ROUTES.SIGN_UP)
console.log(API_ROUTES.SIGN_IN)
console.log(API_ROUTES.BOOKS)
console.log(API_ROUTES.BEST_RATED)

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
