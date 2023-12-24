import { Router } from "express"
import auth from "../middleware/auth.js"
import saveImageOnCloudinary from "../middleware/saveImageOnCloudinary.js"
import saveImageOnDisk from "../middleware/saveImageOnDisk.js"
import imageOptimizer from "../middleware/imageOptimizer.js"
import requestTypeIdentifier from "../middleware/requestTypeIdentifier.js"
import { getAllBooks, getOneBook, getBestRating, createBook, modifyBook, deleteBook, rateBook } from "../controllers/book.js"

let imageStorageMiddleware = {}

if (process.env.ENV === "vercel") {
    imageStorageMiddleware = { storage: saveImageOnCloudinary, optimize: false }
} else {
    imageStorageMiddleware = { storage: saveImageOnDisk, optimize: true }
}

const router = Router()

router.get("/", getAllBooks)
router.get("/bestrating", getBestRating)
router.get("/:id", getOneBook)
router.post(
    "/",
    auth,
    imageStorageMiddleware.storage,
    (req, res, next) => {
        if (imageStorageMiddleware.optimize) {
            imageOptimizer(req, res, next)
        } else {
            next()
        }
    },
    createBook
)
router.put(
    "/:id",
    auth,
    requestTypeIdentifier,
    imageStorageMiddleware.storage,
    (req, res, next) => {
        if (imageStorageMiddleware.optimize) {
            imageOptimizer(req, res, next)
        } else {
            next()
        }
    },
    modifyBook
)
router.delete("/:id", auth, deleteBook)
router.post("/:id/rating", auth, rateBook)

export default router
