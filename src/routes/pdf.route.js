import { Router } from 'express'
import { createPdf, updatePdf, deletePdf, getPdfById, getAllPdf } from '../controllers/pdf.controller.js'
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()



router.route("/").get(getAllPdf)

router.route("/create").post(
    upload.fields([
        {
            name: "pdfFile",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    createPdf
)


router
    .route("/:pdfId")
    .get(getPdfById)
    .patch(upload.single("coverImage"), updatePdf)
    .delete(deletePdf)



export default router