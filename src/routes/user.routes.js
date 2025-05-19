import { Router } from "express";
const router = Router();
import { registerUser, loginUser } from "../controllers/user.controller.js";




// ######################   GENERAL ROUTES ############################

router.route("/registerUser").post(registerUser);
router.route("/loginUser").post(loginUser);
// router.route("/forgetPassword").post(forgetPassword);


export default router;