export const RES_MESSAGES = {
    MISSING_FIELDS: "One of the following fields is missing: titre, auteur, année de publication, genre",
    INVALID_YEAR: "Année de publication field must be a positive number with 4 numbers and must be at maximum the current year",
    INVALID_RATING: "Rating must be between 0 anb 5",
    INVALID_FILETYPE: "Accepted picture formats: jpg/jpeg and png",
    MISSING_IMAGE: "Picture is missing",
    EMPTY_BODY: "Request body is empty",
    INVALID_EMAIL_FORMAT: "Email should have a valid syntax e.g: example@example.com",
    WEAK_PASSWORD: "Password must be at least 8 characters and contain at least 1 uppercase letter + 1 lowercase letter + 1 number + 1 special character",
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
    ADD_RATING_ERROR: "An error has occured while trying to add your rating to the book"
}

export const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}