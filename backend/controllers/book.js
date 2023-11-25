import Book from "../models/book.js"
import { unlinkSync } from "fs"
import { ERROR_MESSAGES, RES_MESSAGES } from "../variables.js"

export async function getAllBooks(req, res) {
    try {
        const books = await Book.find()
        return res.status(200).json(books)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}

export async function getOneBook(req, res) {
    try {
        const book = await Book.findOne({ _id: req.params.id })
        return res.status(200).json(book)
    } catch (err) {
        if (err.message.includes(ERROR_MESSAGES.MONGODB_OBJECTID_DOES_NOT_EXIST)) {
            res.status(404).json({ message: RES_MESSAGES.BOOK_DOES_NOT_EXIST })
        } else {
            res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
        }
    }
}

export async function getBestRating(req, res) {
    try {
        const books = await Book.find()
        const sortedBooks = books.sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating
            }
            return books.indexOf(b) - books.indexOf(a) // Si 2 livres ont la même note moyenne, on privilégie le livre ajouté le plus récemment
        })
        const bestBooks = sortedBooks.slice(0, 3)

        return res.status(200).json(bestBooks)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}

export async function createBook(req, res) {
    try {
        const bookObject = JSON.parse(req.body.book)
        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        bookObject.userId = req.auth.userId
        bookObject.year = Number(bookObject.year) // La date reçue est en string, la DB attend un number
        bookObject.imageUrl = `${req.protocol}://${req.get("host")}/${req.file.path}`

        // Si l'utilisateur n'a pas choisi de note sur le formulaire, ça retourne 0 comme note. Si on reçoit 0 on l'enlève pour ne pas fausser la note moyenne.
        if (bookObject.ratings[0].grade === 0) {
            bookObject.ratings = []
        } else {
            // Si on garde l'objet dans le tableau ratings, alors on actualise le userId pour mettre celui du JWT token pour s'assurer de l'identité de l'utilisateur
            bookObject.ratings[0].userId = req.auth.userId
        }

        const book = new Book({ ...bookObject })

        await book.save()

        return res.status(201).json({ message: RES_MESSAGES.BOOK_CREATED })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}

export async function modifyBook(req, res) {
    try {
        const updatedBook = req.file ? JSON.parse(req.body.book) : { ...req.body }
        // On actualise le userId pour mettre celui du token JWT pour s'assurer de l'identité de l'utilisateur
        updatedBook.userId = req.auth.userId

        // On récupère le livre à modifier depuis la DB, ce qui servira à :
        // -Checker si le userId du livre correspond bien à celui du user qui a initié la requête
        // -A récupérer l'URL de l'image actuelle si on ne la modifie pas (il faut quand même qu'on la fournisse car c'est un champ requis du model Book)
        const bookToUpdate = await Book.findOne({ _id: req.params.id })
        const isUserAuthorized = bookToUpdate.userId === updatedBook.userId
        const hasNewImage = req.file

        if (!isUserAuthorized) {
            if (hasNewImage) {
                unlinkSync(req.file.path)
            }
            return res.status(401).json({ message: ERROR_MESSAGES.UNAUTHORIZED })
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
        res.status(err.status || 500).json({ error: err.message || ERROR_MESSAGES.UNEXPECTED_ERROR })
    }
}

/*
export function deleteThing(req, res, next) {
    Thing.findOne({ _id: req.params.id })
        .then((thing) => {
            if (thing.userId != req.auth.userId) {
                res.status(401).json({ message: "Non autorisé" })
            } else {
                const filename = thing.imageUrl.split("/images/")[1]
                unlink(`images/${filename}`, () => {
                    Thing.deleteOne({ _id: req.params.id })
                        .then(
                            () => {
                                res.status(200).json({
                                    message: "Objet supprimé ! !"
                                })
                            }
                        )
                        .catch(
                            (error) => {
                                res.status(401).json({
                                    error
                                })
                            }
                        )
                })
            }
        })
        .catch(
            (error) => {
                res.status(500).json({ error })
            }
        )
}
 */