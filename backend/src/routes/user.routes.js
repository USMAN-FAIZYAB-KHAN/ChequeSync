import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { registerUser, loginUser, logoutUser, automaticSignUp, getuserdetail, updatepassword, checloldpassword } from "../controllers/user.controllers.js";


const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/automatic-signUp').post(verifyJWT, automaticSignUp);
router.route('/getuserdetail').post(verifyJWT, getuserdetail)
router.route('/updatepassword').post(verifyJWT, updatepassword)
router.route('/checloldpassword').post(verifyJWT, checloldpassword)

export default router