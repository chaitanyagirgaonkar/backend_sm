import { Router } from 'express';
import { createProject, updateProject, deleteProject, getProjectById, getUserAllProject, getAllProject } from "../controllers/project.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from '../middlewares/multer.middleware.js'

const router = Router();

router.use(verifyJWT);

router.route("/projects").get(getUserAllProject)
router.route("/").get(getAllProject)


router.route("/create").post(upload.single("coverImage"), createProject)

router
    .route("/:projectId")
    .get(getProjectById)
    .patch(upload.single("coverImage"), updateProject)
    .delete(deleteProject);

export default router