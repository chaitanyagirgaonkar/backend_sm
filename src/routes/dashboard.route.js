import { Router } from 'express';
import {
    getUserState
} from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getUserState);


export default router