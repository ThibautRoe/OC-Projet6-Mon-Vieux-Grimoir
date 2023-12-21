import sharp from "sharp"
import { unlinkSync, writeFileSync } from "fs"

export default async (req, res, next) => {
    if (req.skipImageProcessing) { return next() }

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