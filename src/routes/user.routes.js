import { Router } from "express";
const router = Router();
import { registerUser, loginUser, getApprovedQuestionPapers } from "../controllers/user.controller.js";




// ######################   GENERAL ROUTES ############################

router.route("/registerUser").post(registerUser);
router.route("/loginUser").post(loginUser);
router.route("/getApprovedQuestionPapers").get(getApprovedQuestionPapers);


export default router;