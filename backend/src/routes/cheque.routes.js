import { Router } from "express";
import { createCheque, getChequesByUserId } from "../controllers/cheque.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const chequeRouter = Router();

chequeRouter.post('/create', createCheque);
chequeRouter.get('/member-cheques/:memberId', getChequesByUserId);

export default chequeRouter