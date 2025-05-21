import { Router } from "express";
import { uploadQuestionPaper, getPendingQuestionPapers, getApprovedQuestionPapers, approveQuestionPaper } from "../controllers/questionPaper.controller.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";
import { isAdminAuth } from "../middlewares/isAdminAuth.middleware.js";
import uploadPDFonlocal from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/uploadQuestionPaper", userAuth, uploadPDFonlocal.single("questionPaper"), uploadQuestionPaper);
router.get("/getPendingQuestionPapers", userAuth, isAdminAuth, getPendingQuestionPapers);
router.put('/approveQuestionPaper/:questionPaperId', userAuth, isAdminAuth, approveQuestionPaper);
router.route("/getApprovedQuestionPapers").get(getApprovedQuestionPapers);


export default router;

