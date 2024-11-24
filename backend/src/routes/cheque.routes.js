import { Router } from "express";
import { 
    createCheque, 
    getChequesByUserId,
    getPostedCheques,
    getAllCheques
} from "../controllers/cheque.controllers.js";
import { 
    getNotification 
} from "../controllers/notification.controllers.js";

const chequeRouter = Router();

chequeRouter.post('/create', createCheque);
chequeRouter.get('/membercheque/:memberId', getChequesByUserId);
chequeRouter.get('/memberpostedcheque', getPostedCheques);
chequeRouter.get('/allmembercheques', getAllCheques);
chequeRouter.get('/get-notifications', getNotification);

export default chequeRouter