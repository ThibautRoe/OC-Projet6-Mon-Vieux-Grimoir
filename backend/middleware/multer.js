import multer from "multer"
const { diskStorage } = multer

const ERROR_MESSAGES = {
    MISSING_FIELDS: "L'un des champs suivants est manquant : titre, auteur, année de publication, genre",
    INVALID_YEAR: "Le champ année de publication doit être un nombre positif de 4 chiffres et doit être au maximum l'année en cours",
    MISSING_IMAGE: "L'image est manquante",
    UNEXPECTED_ERROR: "Une erreur inattendue est survenue"
}

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
        const book = JSON.parse(req.body.book)
        // On génère un nom de fichier basé sur l'auteur, le titre et l'année, sans espaces et en minuscules
        const name = (`${book.author}_${book.title}_${book.year}_`).toLowerCase().split(" ").join("-")
        const extenstion = MIME_TYPES[file.mimetype]
        const fileName = name + Date.now() + "." + extenstion

        callback(null, fileName)
    }
})

const multerMiddleware = multer({ storage }).single("image")

export default (req, res, next) => {
    multerMiddleware(req, res, (err) => {
        const book = JSON.parse(req.body.book)
        let response

        // On check si toutes les données sont présentes et correctement renseignées avant de continuer
        if (!book.title || !book.author || !book.year || !book.genre) {
            response = { status: 400, message: ERROR_MESSAGES.MISSING_FIELDS }
        } else if (isNaN(book.year) || book.year.length !== 4 || book.year > (new Date().getFullYear())) {
            response = { status: 400, message: ERROR_MESSAGES.INVALID_YEAR }
        } else if (!req.file) {
            response = { status: 400, message: ERROR_MESSAGES.MISSING_IMAGE }
        } else if (err) {
            response = { status: err.status || 500, error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR }
        } else {
            next()
        }

        if (response) {
            res.status(response.status).json(response.error ? { error: response.error } : { message: response.message })
        }
    })
}