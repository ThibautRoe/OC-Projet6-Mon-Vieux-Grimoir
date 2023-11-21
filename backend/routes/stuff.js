import { Router } from "express"
import auth from "../middleware/auth.js"
import multer from "../middleware/multer-config.js"
import { createThing, getAllStuff, getOneThing, modifyThing, deleteThing } from "../controllers/stuff.js"
const router = Router()

router.post("/", auth, multer, createThing)
router.get("/", auth, getAllStuff)
router.get("/:id", auth, getOneThing)
router.put("/:id", auth, multer, modifyThing)
router.delete("/:id", auth, multer, deleteThing)

export default router