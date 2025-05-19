import { Router } from "express";
import { uploadQuestionPaper, getPendingQuestionPapers } from "../controllers/educator.controller.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";
import uploadPDFonlocal from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/uploadQuestionPaper", userAuth, uploadPDFonlocal.single("questionPaper"), uploadQuestionPaper);
router.get("/getPendingQuestionPapers", userAuth, getPendingQuestionPapers);

export default router;

