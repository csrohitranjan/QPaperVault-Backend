import { Router } from "express";
import { uploadQuestionPaper } from "../controllers/educator.controllers.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";
import uploadPDFonlocal from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/uploadQuestionPaper", userAuth, uploadPDFonlocal.single("questionPaper"), uploadQuestionPaper);

export default router;

