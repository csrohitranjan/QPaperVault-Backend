import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
import { generateAccessTokens } from "../utils/generateAccessTokens.js"
import { QuestionPaper } from "../models/questionPaper.model.js";


const registerUser = async (req, res) => {
    try {
        let { fullName, email, password } = req.body;

        // Check if any required field is missing
        if (!fullName || !email || !password) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required."
            });
        }

        // Clean and format inputs
        fullName = fullName.trim().toUpperCase();
        email = email.replace(/\s+/g, '').toLowerCase();

        // Check if email ends with valid Amity domain
        const amityEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?amity\.edu$/;
        if (!amityEmailRegex.test(email)) {
            return res.status(400).json({
                status: 400,
                message: "Use a valid Amity email address for registration."
            });
        }

        const existedUser = await User.findOne({ email });
        if (existedUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "User already Registered"
            });
        }

        const insertedUser = await User.create({ fullName, email, password });
        const createdUser = await User.findById(insertedUser._id).select("-password");

        if (!createdUser) {
            return res.status(500).json({
                status: 500,
                success: false,
                message: "Something went wrong while registering the user"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User Registered Successfully",
            user: createdUser
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on: registerUser Controller",
            error: error.message
        });
    }
};


const loginUser = async (req, res) => {

    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Email and Password are required"
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User Does not Exist"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "Wrong Password"
            });
        }

        const { accessToken } = await generateAccessTokens(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password"
        );

        const options = {
            httpOnly: true,
            secure: true
        };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .json({
                status: 200,
                success: true,
                message: "User Logged in Successfully",
                user: loggedInUser,
                accessToken,
            });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in login Controller.",
            error: error.message
        });
    }
};


const getApprovedQuestionPapers = async (req, res) => {
    try {
        const approvedPapers = await QuestionPaper.find({ status: "approved" })
            .populate("uploadedBy", "fullName email role") // optional: fetch uploader info
            .sort({ year: -1, month: -1, createdAt: -1 }); // most recent papers first

        return res.status(200).json({
            status: 200,
            message: "Approved question papers fetched successfully.",
            approvedPapers,
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Failed to fetch approved question papers.",
            error: error.message,
        });
    }
};





export { registerUser, loginUser, getApprovedQuestionPapers }