import { Schema, model } from "mongoose"

const thingSchema = Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    userId: { type: String, required: true },
})

export default model("Thing", thingSchema)