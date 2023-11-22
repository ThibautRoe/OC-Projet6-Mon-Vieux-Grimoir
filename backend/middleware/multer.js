import multer from "multer"
const { diskStorage } = multer

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}

const storage = diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images")
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(" ").join("_")
        const extenstion = MIME_TYPES[file.mimetype]
        callback(null, name + Date.now() + "." + extenstion)
    }
})

export default multer({ storage }).single("image")