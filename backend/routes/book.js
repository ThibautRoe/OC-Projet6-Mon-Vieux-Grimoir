import { Router } from "express"
import auth from "../middleware/auth.js"
import saveImageOnDisk from "../middleware/saveImageOnDisk.js"
import imageOptimizer from "../middleware/imageOptimizer.js"
import { getAllBooks, getOneBook, getBestRating, createBook /*, modifyBook, deleteBook, rateBook */ } from "../controllers/book.js"

const router = Router()

router.get("/", getAllBooks)
router.get("/bestrating", getBestRating)
router.get("/:id", getOneBook)
router.post("/", auth, saveImageOnDisk, imageOptimizer, createBook)
// router.put("/:id", auth, multer, modifyBook)
// router.delete("/:id", auth, deleteBook)
// router.post("/:id/rating", auth, rateBook)

export default router