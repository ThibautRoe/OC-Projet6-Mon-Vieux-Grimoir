import { Schema, model } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true }
})

userSchema.plugin(uniqueValidator)
// Permet juste d'avoir des messages d'erreur plus explicites
// Exemple sans : "error": "E11000 duplicate key error collection: xxx.users index: email_1 dup key: { email: \"a\" }"
// Exemple avec : "error": "User validation failed: email: Error, expected `email` to be unique. Value: `a`"

export default model("User", userSchema)