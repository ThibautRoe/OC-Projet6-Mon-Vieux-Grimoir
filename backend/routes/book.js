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

/* Pour info, pour Vercel, le strict minimum a été fait, les images ne sont pas optimisées via sharp avant d'être envoyées vers Cloudinary, et les images ne sont pas supprimées de Cloudinary s'il y a un problème, si un livre est modifié ou si un livre est supprimé */

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
