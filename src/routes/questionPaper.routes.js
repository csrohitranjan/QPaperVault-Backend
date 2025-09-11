import { Router } from "express";
import {
    uploadQuestionPaper,
    downloadQuestionPaper,
    getPendingQuestionPapers,
    getApprovedQuestionPapers,
    approveQuestionPaper,
    rejectQuestionPaper,
    getUserUploadedQuestionPapers
} from "../controllers/questionPaper.controller.js";

import { userAuth } from "../middlewares/userAuth.middleware.js";
import { isAdminAuth } from "../middlewares/isAdminAuth.middleware.js";
import uploadPDFonlocal from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/uploadQuestionPaper", userAuth, uploadPDFonlocal.single("questionPaper"), uploadQuestionPaper);
router.get('/downloadQuestionPaper/:questionPaperId', downloadQuestionPaper);
router.get("/getPendingQuestionPapers", userAuth, isAdminAuth, getPendingQuestionPapers);
router.put('/approveQuestionPaper/:questionPaperId', userAuth, isAdminAuth, approveQuestionPaper);
router.route("/getApprovedQuestionPapers").get(getApprovedQuestionPapers);
router.put("/rejectQuestionPaper/:questionPaperId", userAuth, isAdminAuth, rejectQuestionPaper);
router.get("/getUserUploadedQuestionPapers", userAuth, getUserUploadedQuestionPapers);


export default router;

