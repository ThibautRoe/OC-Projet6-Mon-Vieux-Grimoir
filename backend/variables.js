export const ERROR_MESSAGES = {
    MISSING_FIELDS: "L'un des champs suivants est manquant : titre, auteur, année de publication, genre",
    INVALID_YEAR: "Le champ année de publication doit être un nombre positif de 4 chiffres et doit être au maximum l'année en cours",
    WRONG_FILETYPE: "Formats d'images acceptés : jpg/jpeg et png",
    MISSING_IMAGE: "L'image est manquante",
    EMPTY_BODY: "Le corps de la requête est vide",
    MISSING_JWT_TOKEN: "Token JWT manquant",
    UNEXPECTED_ERROR: "Une erreur inattendue est survenue",
    MONGODB_OBJECTID_DOES_NOT_EXIST: "Cast to ObjectId failed for value"
}

export const RES_MESSAGES = {
    INVALID_USER: "Email ou mot de passe incorrect",
    USER_CREATED: "Utilisateur créé avec succès",
    BOOK_DOES_NOT_EXIST: "Ce livre n'existe pas",
    BOOK_CREATED: "Livre créé avec succès"
}

export const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}