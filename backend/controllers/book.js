import Book from "../models/book.js"
import { unlinkSync } from "fs"
import { RES_MESSAGES } from "../constants.js"

/**
 * Fonction permettant de récupérer tous les livres de la DB
 * @async
 * @function getAllBooks
 * @param {object} req - Requête envoyée à l'API
 * @param {object} res - Réponse renvoyée au navigateur
 * @returns {object}
 */
export async function getAllBooks(req, res) {
    try {
        const books = await Book.find()

        if (!books.length) { return res.status(404).json({ message: RES_MESSAGES.NO_BOOKS_IN_DB }) }

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
export async function getOneBook(req, res) {
    try {
        const book = await Book.findOne({ _id: req.params.id })

        if (!book) { return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST }) }

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
export async function getBestRating(req, res) {
    try {
        const books = await Book.find()

        if (!books.length) { return res.status(404).json({ message: RES_MESSAGES.NO_BOOKS_IN_DB }) }

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
export async function createBook(req, res) {
    try {
        const bookObject = JSON.parse(req.body.book)
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
export async function modifyBook(req, res) {
    try {
        // On récupère le livre à modifier depuis la DB, ce qui servira à :
        // -Checker si le userId du livre correspond bien à celui du user qui a initié la requête
        // -A récupérer l'URL de l'image actuelle si on ne la modifie pas (il faut quand même qu'on la fournisse car c'est un champ requis du model Book)
        const bookToUpdate = await Book.findOne({ _id: req.params.id })

        if (!bookToUpdate) { return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST }) }

        const updatedBook = req.file ? JSON.parse(req.body.book) : { ...req.body }
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
export async function deleteBook(req, res) {
    try {
        const bookToDelete = await Book.findOne({ _id: req.params.id })

        if (!bookToDelete) { return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST }) }

        const isUserAuthorized = bookToDelete.userId === req.auth.userId

        if (!isUserAuthorized) { return res.status(403).json({ message: RES_MESSAGES.UNAUTHORIZED }) }

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
export async function rateBook(req, res) {
    try {
        const isBodyEmpty = Object.keys(req.body).length === 0 ? true : false

        if (isBodyEmpty) { return res.status(400).json({ message: RES_MESSAGES.EMPTY_BODY }) }

        const newRating = { ...req.body }

        if (newRating.rating < 0 || newRating.rating > 5) { return res.status(400).json({ message: RES_MESSAGES.INVALID_RATING }) }

        const bookToRate = await Book.findOne({ _id: req.params.id })

        if (!bookToRate) { return res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST }) }

        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        newRating.userId = req.auth.userId
        // On remplace la clé rating (envoyée par la requête) par la clé grade (attendue par le modèle Book)
        newRating.grade = newRating.rating
        delete newRating.rating

        // On check si l'utilisateur a déjà déposé une note
        let oldRatings = bookToRate.ratings
        const hasUserAlreadyRated = oldRatings.some(item => item.userId === newRating.userId);

        if (hasUserAlreadyRated) { return res.status(400).json({ message: RES_MESSAGES.ALREADY_RATED }) }

        // Calcul de la nouvelle note moyenne
        oldRatings.push(newRating)
        const sum = oldRatings.reduce((total, item) => total + item.grade, 0)
        const newAverageRating = sum / oldRatings.length

        const updatedBook = await Book.findOneAndUpdate(
            { _id: req.params.id },
            {
                $push: { ratings: newRating },
                averageRating: newAverageRating
            },
            { new: true, useFindAndModify: false }) // new: true pour que mongoose renvoie de document mis à jour plutôt que le document d'origine

        if (updatedBook) { return res.status(200).json(updatedBook) }

        return res.status(500).json({ message: RES_MESSAGES.ADD_RATING_ERROR })
    } catch (err) {
        if (err.message.includes(RES_MESSAGES.MONGODB_OBJECTID_ERROR)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}