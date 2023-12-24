import { RES_MESSAGES, MIME_TYPES } from "../constants.js"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"

/**
 * Fonction pour s'assurer que la requête soit correcte avant de la traiter
 * @function requestChecker
 * @param {object} req - Requête envoyée à l'API
 * @returns {object} response - Objet contenant le statut et le message d'erreur, sinon un objet vide
 */
function requestChecker(req) {
    let response = {}
    const book = JSON.parse(req.body.book)
    const isMissingFields = !book.title || !book.author || !book.year || !book.genre
    const isInvalidYear = isNaN(book.year) || book.year.length !== 4 || book.year > new Date().getFullYear()
    const isWrongFileType = !MIME_TYPES[req.file.mimetype]

    // On teste que tous les champs du formulaire soient bien renseignés et que l'image est du bon format
    if (isMissingFields) {
        response = { status: 400, message: RES_MESSAGES.MISSING_FIELDS }
    } else if (isInvalidYear) {
        response = { status: 400, message: RES_MESSAGES.INVALID_YEAR }
    } else if (isWrongFileType) {
        response = { status: 400, message: RES_MESSAGES.INVALID_FILETYPE }
    } else if (book.ratings && book.averageRating) {
        const isWrongRating = book.ratings[0].grade < 0 || book.ratings[0].grade > 5 || book.averageRating < 0 || book.averageRating > 5
        if (isWrongRating) {
            response = { status: 400, message: RES_MESSAGES.INVALID_RATING }
        }
    }

    return response
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "MonVieuxGrimoire",
        allowedFormats: ["jpeg", "jpg", "png"],
    },
})

const upload = multer({ storage })

const multerMiddleware = upload.single("image") // .single("image") = un seul fichier à la fois, venant du champ "image" du formulaire

export default (req, res, next) => {
    if (req.skipImageProcessing) {
        return next()
    }

    try {
        multerMiddleware(req, res, async () => {
            if (!req.file) {
                return res.status(400).json({ message: RES_MESSAGES.MISSING_IMAGE })
            }

            const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

            if (isBodyEmpty) {
                return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY })
            }

            const response = requestChecker(req)
            const isResponseEmpty = Object.keys(response).length === 0 ? true : false

            if (!isResponseEmpty) {
                return res.status(response.status).json({ message: response.message })
            }

            next()
        })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}
