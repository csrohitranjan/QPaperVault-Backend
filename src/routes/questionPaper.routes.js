import { Router } from "express";
import { uploadQuestionPaper, getPendingQuestionPapers, getApprovedQuestionPapers, approveQuestionPaper } from "../controllers/questionPaper.controller.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";
import uploadPDFonlocal from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/uploadQuestionPaper", userAuth, uploadPDFonlocal.single("questionPaper"), uploadQuestionPaper);
router.get("/getPendingQuestionPapers", userAuth, getPendingQuestionPapers);
router.put('/questionPaper/approve/:questionPaperId', approveQuestionPaper);
router.route("/getApprovedQuestionPapers").get(getApprovedQuestionPapers);


export default router;

