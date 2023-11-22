import { unlink } from "fs"
import Book from "../models/book.js"

export async function getAllBooks(req, res) {
    try {
        const books = await Book.find()
        res.status(200).json(books)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
    }
}

export async function getOneBook(req, res) {
    try {
        const book = await Book.findOne({ _id: req.params.id })
        res.status(200).json(book)
    } catch (err) {
        if (err.message.includes("Cast to ObjectId failed for value")) {
            res.status(404).json({ message: "Ce livre n'existe pas" })
        } else {
            res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
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

        res.status(200).json(bestBooks)
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
    }
}

export async function createBook(req, res) {
    try {
        const bookObject = JSON.parse(req.body.book)
        // On supprime le userId envoyé par la requête, on se servira de celui retourné par le middleware auth pour s'assurer de l'identité de l'utilisateur
        delete bookObject.userId
        bookObject.year = parseInt(bookObject.year) // La date reçue est en string, la DB attend un number

        // Si l'utilisateur n'a pas choisi de note, ça retourne 0 comme note. Si on reçoit 0 on l'enlève pour ne pas fausser la note moyenne
        if (bookObject.ratings[0].grade === 0) {
            bookObject.ratings = []
        }

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get("host")}/${req.file.path}`
        })

        await book.save()

        res.status(201).json({ message: "Livre créé avec succès" })
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || "Une erreur inattendue est survenue" })
    }
}

/*
export function getOneThing(req, res, next) {
    Thing.findOne({
        _id: req.params.id
    }).then(
        (thing) => {
            res.status(200).json(thing)
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error
            })
        }
    )
}

export function modifyThing(req, res, next) {
    const thingObject = req.file ? {
        ...JSON.parse(req.body.thing),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body }

    delete thingObject.userId

    Thing.findOne({ _id: req.params.id }).then(
        (thing) => {
            if (thing.userId != req.auth.userId) {
                res.status(401).json({ message: "Non autorisé" })
            } else {
                Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
                    .then(
                        () => {
                            res.status(200).json({
                                message: "Objet modifié !"
                            })
                        }
                    ).catch(
                        (error) => {
                            res.status(401).json({
                                error
                            })
                        }
                    )
            }
        }
    )
}

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