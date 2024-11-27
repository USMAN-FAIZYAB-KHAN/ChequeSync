import { Router } from "express";
import { registerUser, loginUser, logoutUser, automaticSignUp, getuserdetail, updatepassword, checloldpassword } from "../controllers/user.controllers.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(logoutUser)
router.route('/automatic-signUp').post(automaticSignUp)
router.route('/getuserdetail').post(getuserdetail)
router.route('/updatepassword').post(updatepassword)
router.route('/checloldpassword').post(checloldpassword)

export default router