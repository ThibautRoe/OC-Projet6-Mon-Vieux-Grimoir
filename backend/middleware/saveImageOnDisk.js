import { RES_MESSAGES, MIME_TYPES } from "../constants.js"
import multer from "multer"

const { diskStorage } = multer

// Variable response globale pour quelle soit accessible par requestChecker() et par multerMiddleware()
let response = {}

/**
 * Fonction pour s'assurer que la requête soit correcte avant de la traiter
 * @function requestChecker
 * @param {object} req - Requête envoyée à l'API
 * @param {object} file - Fichier image envoyé dans la requête
 * @returns {boolean}
 */
function requestChecker(req, file) {
    response = {} // Réinitialisation de response pour pas qu'il garde le contenu généré lors de la précédente requête
    const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

    // On teste d'abord si le corps de la requête est vide, sinon le JSON.parse() posera une erreur
    if (isBodyEmpty) {
        response = { status: 400, message: RES_MESSAGES.EMPTY_BODY }
    } else {
        const book = JSON.parse(req.body.book)
        const isMissingFields = !book.title || !book.author || !book.year || !book.genre
        const isInvalidYear = isNaN(book.year) || book.year.length !== 4 || book.year > new Date().getFullYear()
        const isWrongFileType = !MIME_TYPES[file.mimetype]

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
    }

    // Si response (après voir été réinitialisé comme objet vide) devient un objet contenant la clé "status" après les tests ci-dessus,
    // c'est qu'il y a une erreur, alors on return true, sinon on return false
    return !!response.status
}

const storage = diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images")
    },
    filename: (req, file, callback) => {
        const book = JSON.parse(req.body.book)
        // On génère un nom de fichier basé sur l'auteur, le titre et l'année, sans espaces et en minuscules
        const name = `${book.author}_${book.title}_${book.year}_`.toLowerCase().split(" ").join("-")
        const extension = MIME_TYPES[file.mimetype]
        const fileName = name + Date.now() + "." + extension
        callback(null, fileName)
    },
})

/**
 * Fonction permettant de valider ou non le stockage en local du fichier image selon le retour de la fonction requestChecker
 * @function fileFilter
 * @param {object} req - Requête envoyée à l'API
 * @param {object} file - Fichier image envoyé dans la requête
 * @param {object} callback
 * @returns {object}
 */
function fileFilter(req, file, callback) {
    const error = requestChecker(req, file)

    if (error) {
        // Si la requête n'est pas bonne, ont n'enregistre pas le fichier en local
        callback(null, false)
    } else {
        callback(null, true)
    }
}

const multerMiddleware = multer({ storage, fileFilter }).single("image") // .single("image") = un seul fichier à la fois, venant du champ "image" du formulaire

export default (req, res, next) => {
    if (req.skipImageProcessing) {
        return next()
    }

    try {
        // On initialise response comme ça car s'il n'y a pas d'image dans la requête, fileFilter() (et donc requestChecker()) n'est pas du tout
        // appelé et donc response ne sera pas actualisée avec les tests sur les champs du formulaire et sur le format de l'image. Donc si elle
        // reste avec ce contenu c'est qu'il n'y a pas eu d'image dans la requête
        response = { status: 400, message: RES_MESSAGES.MISSING_IMAGE }

        multerMiddleware(req, res, async () => {
            const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

            if (isBodyEmpty) {
                return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY })
            }

            if (response.status) {
                return res.status(response.status).json({ message: response.message })
            }

            next()
        })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}
