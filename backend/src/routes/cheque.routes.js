import { Router } from "express";
import { createCheque } from "../controllers/cheque.controllers.js";
import { upload } from "../middlewares/upload.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const chequeRouter = Router();

chequeRouter.post('/create', verifyJWT, upload.single('image'), createCheque);

export default chequeRouter