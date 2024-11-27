import { Router } from "express";
import { 
    createCheque, 
    getChequesByUserId,
    getPostedCheques,
    updatechequestatus,
    getAllCheques,
    getReceivedCheques
} from "../controllers/cheque.controllers.js";
import { 
    getNotification 
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const chequeRouter = Router();

chequeRouter.post('/create',verifyJWT, createCheque);
chequeRouter.get('/membercheque/:memberId',verifyJWT, getChequesByUserId);
chequeRouter.get('/memberpostedcheque',verifyJWT, getPostedCheques);
chequeRouter.get('/allmembercheques',verifyJWT, getAllCheques);
chequeRouter.get('/get-notifications',verifyJWT, getNotification);
chequeRouter.post('/updatechequestatus',verifyJWT, updatechequestatus);
chequeRouter.get('/branchReceivedCheques',verifyJWT, getReceivedCheques);

export default chequeRouter