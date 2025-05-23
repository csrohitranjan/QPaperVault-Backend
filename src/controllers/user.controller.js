import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
import { generateAccessTokens } from "../utils/generateAccessTokens.js"
import { sendEmail } from "../utils/email.js"
import jwt from "jsonwebtoken";


const registerUser = async (req, res) => {
    try {
        let { fullName, email, enrollmentNumber, password } = req.body;

        // Check if any required field is missing
        if (!fullName || !email || !password || !enrollmentNumber) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required."
            });
        }

        // Clean and format inputs
        fullName = fullName.trim().toUpperCase();
        email = email.replace(/\s+/g, '').toLowerCase();
        enrollmentNumber = enrollmentNumber.trim().toUpperCase();

        // Check if email ends with valid Amity domain
        const amityEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?amity\.edu$/;
        if (!amityEmailRegex.test(email)) {
            return res.status(400).json({
                status: 400,
                message: "Use a valid Amity email address for registration."
            });
        }

        const existedUser = await User.findOne({
            $or: [{ email }, { enrollmentNumber }]
        });

        if (existedUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "User already Registered"
            });
        }

        const insertedUser = await User.create({ fullName, email, enrollmentNumber, password });

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

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                status: 403,
                success: false,
                message: "Your account has been blocked. Please contact admin."
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


const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        let { phoneNumber, department, programme } = req.body;

        if (!phoneNumber && !department && !programme) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "At least one field (phoneNumber, department, programme) is required to update.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found.",
            });
        }

        const updates = {};

        // Handle phoneNumber update
        if (phoneNumber) {
            const existingPhoneUser = await User.findOne({ phoneNumber });
            if (existingPhoneUser) {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Phone number already in use.",
                });
            }
            updates.phoneNumber = phoneNumber;
        }

        // Handle department update only if it is not already set
        if (department) {
            department = department.trim().toUpperCase();
            if (user.department) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "Department is already set and cannot be updated.",
                });
            }
            updates.department = department;
        }

        // Handle programme update only if it is not already set
        if (programme) {
            programme = programme.trim().toUpperCase();
            if (user.programme) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "Programme is already set and cannot be updated.",
                });
            }
            updates.programme = programme;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on: updateUserProfile Controller",
            error: error.message,
        });
    }
};


const changePassword = async (req, res) => {
    try {
        let { oldPassword, newPassword, confirmPassword } = req.body;

        // Trim passwords to avoid accidental spaces
        oldPassword = oldPassword?.trim();
        newPassword = newPassword?.trim();
        confirmPassword = confirmPassword?.trim();

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Old Password, New Password & Confirm Password are required"
            });
        }

        if (oldPassword === newPassword) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "Old Password & New Password cannot be the same"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "New Password & Confirm Password do not match"
            });
        }

        // Basic password strength check (can be expanded)
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "New password must be at least 8 characters long"
            });
        }

        const user = await User.findById(req.user?._id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            });
        }

        // Require phone number to be set before allowing password change
        if (!user.phoneNumber) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Update your phoneNumber in your profile before changing your password"
            });
        }

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isOldPasswordCorrect) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid Old Password"
            });
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Error in changePassword:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in changePassword controller",
            error: error.message
        });
    }
};



const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 400,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.RESET_PASSWORD_SECRET,
            { expiresIn: "5m" }
        );

        const resetUrl = `${process.env.FRONTEND_URL.replace(/^http:/, 'https:')}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 5 minute.</p>`,
        });

        return res.status(200).json({
            status: 200,
            message: "Password reset email sent. Please check your inbox."
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error on requestPasswordReset",
            error: error.message
        });
    }
};



const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: 400,
                message: "Token, new password, and confirm password are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: 400,
                message: "New password and confirm password do not match",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
        } catch (err) {
            return res.status(400).json({
                status: 400,
                message: "Invalid or expired token",
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
            });
        }

        // Update password and save (hashing is handled in pre-save hook)
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Password has been reset successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error on resetPassword Controller",
            error: error.message,
        });
    }
};






export { registerUser, loginUser, updateUserProfile, changePassword, requestPasswordReset, resetPassword }