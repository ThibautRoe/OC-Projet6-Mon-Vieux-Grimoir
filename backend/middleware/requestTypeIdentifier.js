
export default async (req, res, next) => {
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