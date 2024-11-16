import { Router } from "express";
import { registerUser, loginUser, logoutUser, automaticSignUp } from "../controllers/user.controllers.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(logoutUser)
router.route('/automatic-signUp').post(automaticSignUp)

export default router