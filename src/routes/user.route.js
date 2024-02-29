import { Router } from 'express'
import { registerUser, sendOtp, loginUser } from '../controllers/user.controller.js'

const router = Router()

router.route("/register").post(registerUser)
router.route('/sendotp').post(sendOtp)
router.route("/login").post(loginUser)



export default router