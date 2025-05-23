import { Router } from "express";
const router = Router();
import {
    registerUser,
    loginUser,
    updateUserProfile,
    changePassword
} from "../controllers/user.controller.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";




// Registration & Login
router.post("/registerUser", registerUser);
router.post("/loginUser", loginUser);

// Update User Profile
router.put("/updateUserProfile", userAuth, updateUserProfile);

// Change Password
router.put("/changePassword", userAuth, changePassword);




export default router;