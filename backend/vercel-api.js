import express from "express"
import helmet from "helmet"
import { connect } from "mongoose"
import * as path from "path"
import { fileURLToPath } from "url"
import { rateLimit } from "express-rate-limit"
import jwt from "jsonwebtoken"
const { verify, sign } = jwt
import { Router } from "express"
import { Schema, model } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import multer from "multer"
import sharp from "sharp"
import { unlinkSync, writeFileSync, readFileSync } from "fs"
import { hash, compare } from "bcrypt"
import validator from "validator"

const fileName = fileURLToPath(import.meta.url)
const dirPath = path.dirname(fileName)

const RES_MESSAGES = {
    MISSING_FIELDS: "One of the following fields is missing: titre, auteur, année de publication, genre",
    INVALID_YEAR: "Année de publication field must be a positive number with 4 numbers and must be at maximum the current year",
    INVALID_RATING: "Rating must be between 0 anb 5",
    INVALID_FILETYPE: "Accepted picture formats: jpg/jpeg and png",
    MISSING_IMAGE: "Picture is missing",
    EMPTY_BODY: "Request body is empty",
    INVALID_EMAIL_FORMAT: "Email should have a valid syntax e.g: example@example.com",
    WEAK_PASSWORD:
        "Password must be at least 8 characters and contain at least 1 uppercase letter + 1 lowercase letter + 1 number + 1 special character",
    MISSING_JWT_TOKEN: "JWT token is missing",
    UNEXPECTED_ERROR: "An unexpected error has occured",
    MONGODB_OBJECTID_ERROR: "Cast to ObjectId failed for value",
    UNAUTHORIZED: "Unauthorized request",
    INVALID_USER: "Wrong email and/or password",
    USER_CREATED: "User created successfully",
    BOOK_DOES_NOT_EXIST: "This book does not exist",
    NO_BOOKS_IN_DB: "There are no books",
    BOOK_CREATED: "Book created successfully",
    BOOK_MODIFIED: "Book modified successfully",
    BOOK_MODIFICATION_ERROR: "An error has occured while trying to updade the book, or there was nothing to update",
    BOOK_DELETED: "Book deleted successfully",
    BOOK_DELETION_ERROR: "An error has occured while trying to delete the book",
    ALREADY_RATED: "You can rate a book only once",
    ADD_RATING_ERROR: "An error has occured while trying to add your rating to the book",
}

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
}

// 100 requêtes max / 1sec
const globalLimiter = rateLimit({ limit: 100, windowMs: 1000 })

// 10 requêtes max / 5sec
const authLimiter1 = rateLimit({ limit: 10, windowMs: 5 * 1000 })

// 50 requêtes max / 30min
const authLimiter2 = rateLimit({ limit: 50, windowMs: 30 * 60 * 1000 })

// 5000 requêtes max / 1min
const booksLimiter = rateLimit({ limit: 5000, windowMs: 60 * 1000 })

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: { type: String, required: true },
})

userSchema.plugin(uniqueValidator)
// Permet juste d'avoir des messages d'erreur plus explicites
// Exemple sans : "error": "E11000 duplicate key error collection: xxx.users index: email_1 dup key: { email: \"a\" }"
// Exemple avec : "error": "User validation failed: email: Error, expected `email` to be unique. Value: `a`"

const User = model("User", userSchema)

const bookSchema = new Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [{ userId: String, grade: Number }],
    averageRating: Number,
})

const Book = model("Book", bookSchema)

function auth(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: RES_MESSAGES.MISSING_JWT_TOKEN })
    }

    try {
        const secret = readFileSync(process.env.SSH_KEY_PUBLIC) // On vérifie avec la clé publique
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = verify(token, secret)
        const userId = decodedToken.userId
        req.auth = {
            userId: userId,
        }

        next()
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

async function requestTypeIdentifier(req, res, next) {
    const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

    // Si une image est envoyée, req.body est un objet vide, on passe aux middlewares d'après pour traiter l'image
    if (isBodyEmpty) {
        next()
    } else {
        // Si req.body n'est pas vide, il n'y a pas d'image, on rajoute un paramètre dans la requête qui sera lu par les middlewares d'après pour
        // qu'ils ne fassent pas leur job et passent directement à la suite
        req.skipImageProcessing = true
        next()
    }
}

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

function saveImageOnDisk(req, res, next) {
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

async function imageOptimizer(req, res, next) {
    if (req.skipImageProcessing) {
        return next()
    }

    //Optimisation du fichier d'origine
    const webpBuffer = await sharp(req.file.path)
        .webp({ quality: 80 })
        .resize({ height: 600, fit: "inside", withoutEnlargement: true })
        .toBuffer()

    // Suppression du fichier d'origine
    unlinkSync(req.file.path)

    // On remplace l'extension d'origine dans le nom et dans le chemin du fichier par "_optimized.webp"
    const webpPath = req.file.path.split(".").slice(0, -1).concat("optimized.webp").join("_")
    const webpFileName = req.file.filename.split(".").slice(0, -1).concat("optimized.webp").join("_")

    // Enregistrement du nouveau fichier .webp
    writeFileSync(webpPath, webpBuffer)

    // Mise à jour du nom et du chemin d'accès du fichier dans la requête pour pointer vers le nouveau fichier .webp
    req.file.path = webpPath
    req.file.filename = webpFileName

    next()
}

/**
 * Fonction permettant de créer un nouvel utilisateur dans la DB
 * @async
 * @function signup
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function signup(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) {
            return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY })
        }

        if (!validator.isEmail(req.body.email)) {
            return res.status(400).json({ message: RES_MESSAGES.INVALID_EMAIL_FORMAT })
        }

        if (!validator.isStrongPassword(req.body.password)) {
            return res.status(400).json({ message: RES_MESSAGES.WEAK_PASSWORD })
        }

        const hashedPassword = await hash(req.body.password, parseInt(process.env.BCRYPT_SALT_ROUND))

        const user = new User({
            email: req.body.email,
            password: hashedPassword,
        })

        await user.save()

        return res.status(201).json({ message: RES_MESSAGES.USER_CREATED })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant de vérifier si un utilisateur existe dans la DB et si oui, de lui retourner un token JWT
 * @async
 * @function login
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function login(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) {
            return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY })
        }

        if (!validator.isEmail(req.body.email)) {
            return res.status(400).json({ message: RES_MESSAGES.INVALID_EMAIL_FORMAT })
        }

        const secret = readFileSync(process.env.SSH_KEY_PRIVATE) // On encode avec la clé privée

        const user = await User.findOne({ email: req.body.email })

        if (!user) {
            return res.status(400).json({ message: RES_MESSAGES.INVALID_USER })
        }

        const valid = await compare(req.body.password, user.password)

        if (!valid) {
            return res.status(400).json({ message: RES_MESSAGES.INVALID_USER })
        }

        return res.status(200).json({
            userId: user._id,
            token: sign({ userId: user._id }, secret, { expiresIn: process.env.JWT_EXPIRE, algorithm: "RS256" }),
        })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant de récupérer tous les livres de la DB
 * @async
 * @function getAllBooks
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function getAllBooks(req, res) {
    try {
        const books = await Book.find()

        if (!books.length) {
            return res.status(404).json({ message: RES_MESSAGES.NO_BOOKS_IN_DB })
        }

        return res.status(200).json(books)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant de récupérer un livre de la DB via son ID unique
 * @async
 * @function getOneBook
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function getOneBook(req, res) {
    try {
        const book = await Book.findOne({ _id: req.params.id })

        if (!book) {
            return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        }

        return res.status(200).json(book)
    } catch (err) {
        if (err.message.includes(RES_MESSAGES.MONGODB_OBJECTID_ERROR)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}

/**
 * Fonction permettant de récupérer les 3 livres les mieux notés de la DB
 * @async
 * @function getBestRating
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function getBestRating(req, res) {
    try {
        const books = await Book.find()

        if (!books.length) {
            return res.status(404).json({ message: RES_MESSAGES.NO_BOOKS_IN_DB })
        }

        const sortedBooks = books.sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating
            }
            return books.indexOf(b) - books.indexOf(a) // Si 2 livres ont la même note moyenne, on privilégie le livre ajouté le plus récemment
        })

        const bestBooks = sortedBooks.slice(0, 3)

        return res.status(200).json(bestBooks)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant d'ajouter un nouveau livre dans la DB
 * @async
 * @function createBook
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function createBook(req, res) {
    try {
        let bookObject = JSON.parse(req.body.book)
        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        bookObject.userId = req.auth.userId
        bookObject.ratings[0].userId = req.auth.userId
        bookObject.year = Number(bookObject.year) // La date reçue est en string, la DB attend un number
        bookObject.imageUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`

        const book = new Book({ ...bookObject })

        await book.save()

        return res.status(201).json({ message: RES_MESSAGES.BOOK_CREATED })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}

/**
 * Fonction permettant de modifier un livre de la DB via son ID unique
 * @async
 * @function modifyBook
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function modifyBook(req, res) {
    try {
        // On récupère le livre à modifier depuis la DB, ce qui servira à :
        // -Checker si le userId du livre correspond bien à celui du user qui a initié la requête
        // -A récupérer l'URL de l'image actuelle si on ne la modifie pas (il faut quand même qu'on la fournisse car c'est un champ requis du model Book)
        let bookToUpdate = await Book.findOne({ _id: req.params.id })

        if (!bookToUpdate) {
            return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        }

        let updatedBook = req.file ? JSON.parse(req.body.book) : { ...req.body }
        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        updatedBook.userId = req.auth.userId

        const isUserAuthorized = bookToUpdate.userId === updatedBook.userId
        const hasNewImage = req.file

        if (!isUserAuthorized) {
            if (hasNewImage) {
                unlinkSync(req.file.path)
            }
            return res.status(403).json({ message: RES_MESSAGES.UNAUTHORIZED })
        }

        updatedBook.year = Number(updatedBook.year) // La date reçue est en string, la DB attend un number
        // S'il y a une nouvelle image, on prend l'URL de la nouvelle image, sinon on prend l'URL de l'image actuelle
        updatedBook.imageUrl = req.file ? `${req.protocol}://${req.get("host")}/${req.file.path}` : bookToUpdate.imageUrl

        const result = await Book.updateOne({ _id: req.params.id }, { ...updatedBook })
        const modificationIsSuccessful = result.modifiedCount === 1 ? true : false

        if (modificationIsSuccessful) {
            // On supprime l'ancienne image uniquement si la modification a réussi et s'il y avait une nouvelle image
            if (req.file) {
                unlinkSync(bookToUpdate.imageUrl.replace(`${req.protocol}://${req.get("host")}/`, ""))
            }
            // Amélioration possible : on pourrait renommer l'ancien fichier pour refléter les nouvelles infos du livre
            return res.status(200).json({ message: RES_MESSAGES.BOOK_MODIFIED })
        }

        if (hasNewImage) {
            unlinkSync(req.file.path)
        }

        return res.status(500).json({ message: RES_MESSAGES.BOOK_MODIFICATION_ERROR })
    } catch (err) {
        if (err.message.includes(RES_MESSAGES.MONGODB_OBJECTID_ERROR)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}

/**
 * Fonction permettant de supprimer un livre de la DB via son ID unique
 * @async
 * @function deleteBook
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function deleteBook(req, res) {
    try {
        const bookToDelete = await Book.findOne({ _id: req.params.id })

        if (!bookToDelete) {
            return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        }

        const isUserAuthorized = bookToDelete.userId === req.auth.userId

        if (!isUserAuthorized) {
            return res.status(403).json({ message: RES_MESSAGES.UNAUTHORIZED })
        }

        const result = await bookToDelete.deleteOne()
        const deletionIsSuccessful = result.deletedCount === 1 ? true : false

        if (deletionIsSuccessful) {
            unlinkSync(bookToDelete.imageUrl.replace(`${req.protocol}://${req.get("host")}/`, ""))
            return res.status(200).json({ message: RES_MESSAGES.BOOK_DELETED })
        }

        return res.status(500).json({ message: RES_MESSAGES.BOOK_DELETION_ERROR })
    } catch (err) {
        if (err.message.includes(RES_MESSAGES.MONGODB_OBJECTID_ERROR)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}

/**
 * Fonction permettant de rajouter une note à un livre de la DB via son ID unique
 * @async
 * @function rateBook
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
async function rateBook(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) {
            return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY })
        }

        let newRating = { ...req.body }

        if (newRating.rating < 0 || newRating.rating > 5) {
            return res.status(400).json({ message: RES_MESSAGES.INVALID_RATING })
        }

        let bookToRate = await Book.findOne({ _id: req.params.id })

        if (!bookToRate) {
            return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        }

        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        newRating.userId = req.auth.userId
        // On remplace la clé rating (envoyée par la requête) par la clé grade (attendue par le modèle Book)
        newRating.grade = newRating.rating
        delete newRating.rating

        // On check si l'utilisateur a déjà déposé une note
        const hasUserAlreadyRated = bookToRate.ratings.some((item) => item.userId === newRating.userId)

        if (hasUserAlreadyRated) {
            return res.status(400).json({ message: RES_MESSAGES.ALREADY_RATED })
        }

        // Calcul de la nouvelle note moyenne
        bookToRate.ratings.push(newRating)
        const sum = bookToRate.ratings.reduce((total, item) => total + item.grade, 0)
        bookToRate.averageRating = sum / bookToRate.ratings.length

        const updatedBook = await bookToRate.save()

        return res.status(200).json(updatedBook)
    } catch (err) {
        if (err.message.includes(RES_MESSAGES.MONGODB_OBJECTID_ERROR)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}

const userRouter = Router()
userRouter.post("/signup", signup)
userRouter.post("/login", login)

const booksRouter = Router()
booksRouter.get("/", getAllBooks)
booksRouter.get("/bestrating", getBestRating)
booksRouter.get("/:id", getOneBook)
booksRouter.post("/", auth, saveImageOnDisk, imageOptimizer, createBook)
booksRouter.put("/:id", auth, requestTypeIdentifier, saveImageOnDisk, imageOptimizer, modifyBook)
booksRouter.delete("/:id", auth, deleteBook)
booksRouter.post("/:id/rating", auth, rateBook)

if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST) {
    console.error("Les variables d'environnement DB_USER, DB_PASS et DB_HOST doivent être définies.")
    process.exit(1)
}

try {
    await connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`)
    console.log("Connexion à MongoDB réussie !")

    const app = express()
    const PORT = 4000

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`)
    })

    app.get("/", (req, res) => {
        res.send("Hey this is my API running 🥳")
    })

    app.use(helmet({ crossOriginResourcePolicy: false }))

    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        res.setHeader("Content-Type", "text/html")
        res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate")
        next()
    })

    app.use(express.json())

    app.use(globalLimiter)

    app.use("/api/auth", authLimiter1, authLimiter2, userRouter)
    app.use("/api/books", booksLimiter, booksRouter)
    app.use("/images", express.static(path.join(dirPath, "images")))
} catch (error) {
    console.error("Connexion à MongoDB échouée !")
    throw error
}

export default app
