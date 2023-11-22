import { Router } from "express"
import auth from "../middleware/auth.js"
import multer from "../middleware/multer.js"
import { getAllBooks, getOneBook, getBestRating, createBook, modifyBook, deleteBook, rateBook } from "../controllers/book.js"

const router = Router()

router.get("/", getAllBooks)
router.get("/:id", getOneBook)
router.get("/bestrating", getBestRating)
router.post("/", auth, multer, createBook)
router.put("/:id", auth, multer, modifyBook)
router.delete("/:id", auth, deleteBook)
router.post("/:id/rating", auth, rateBook)

export default router