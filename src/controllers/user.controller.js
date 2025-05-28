import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
import { generateAccessTokens } from "../utils/generateAccessTokens.js"
import { sendEmail } from "../utils/email.js"
import jwt from "jsonwebtoken";


const requestRegistration = async (req, res) => {
    try {
        let { fullName, email, enrollmentNumber, password } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !enrollmentNumber) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "All fields are required."
            });
        }

        // Sanitize and format inputs
        fullName = fullName.trim().toUpperCase();
        email = email.replace(/\s+/g, '').toLowerCase();
        enrollmentNumber = enrollmentNumber.trim().toUpperCase();

        //Check for valid Amity email
        const amityEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?amity\.edu$/;
        if (!amityEmailRegex.test(email)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Please use a valid Amity email address."
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [{ email }, { enrollmentNumber }]
        });

        if (existingUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "User already registered."
            });
        }

        // Generate a verification token
        const token = jwt.sign(
            { fullName, email, enrollmentNumber, password },
            process.env.REGISTRATION_TOKEN_SECRET,
            { expiresIn: "5m" }
        );

        // Prepare verification link
        const verifyLink = `${process.env.FRONTEND_URL}/confirm-registration?token=${token}`;

        // Send email
        await sendEmail({
            to: email,
            subject: "Complete Your Registration",
            html: `
    <div style="max-width: 480px; margin: 30px auto; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.06); font-family: Arial, sans-serif; color: #444;">
      <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 24px; text-align: center; color: #fff; font-weight: 600; font-size: 22px;">
        Complete Your Registration
      </div>
      <div style="padding: 24px; font-size: 14px; line-height: 1.5;">
        <p>Hello ${fullName},</p>
        <p>Please activate your account by clicking the button below. This link expires in 5 minutes.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verifyLink}" target="_blank" style="background: linear-gradient(90deg, #0a66c2, #004182); color: #fff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p>If you didn’t request this, ignore this email.</p>
      </div>
      <div style="background-color: #e1e4e8; padding: 14px; text-align: center; font-size: 12px; color: #555555; line-height: 1.2;">
        Designed and developed by Mr. Rohit Ranjan
        <a href="https://www.linkedin.com/in/csrohitranjan" target="_blank" rel="noopener noreferrer" style="display: inline-block; vertical-align: middle; margin-left: 6px;">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style="width: 12px; height: 12px; opacity: 0.7; vertical-align: middle;" />
        </a>
      </div>
    </div>
  `
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Verification email sent. Please check your inbox."
        });

    } catch (error) {
        console.error("Error in requestRegistration:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error on requestRegistration Controller",
            error: error.message
        });
    }
};


const confirmRegistration = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Verification token is missing."
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.REGISTRATION_TOKEN_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    status: 401,
                    success: false,
                    message: "Verification link has expired. Please request registration again."
                });
            }
            if (err.name === "JsonWebTokenError") {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "Invalid verification token."
                });
            }

            // Generic token error
            return res.status(500).json({
                status: 500,
                success: false,
                message: "Token verification failed.",
                error: err.message
            });
        }

        const { fullName, email, enrollmentNumber, password } = decoded;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { enrollmentNumber }]
        });

        if (existingUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "User is already registered and the account is active."
            });
        }

        // Create new user
        const newUser = await User.create({
            fullName,
            email,
            enrollmentNumber,
            password
        });

        const createdUser = await User.findById(newUser._id).select("-password");

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Registration successful and account is now active.",
            user: createdUser
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error on confirmRegistration Controller",
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
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "Invalid phone number.",
                });
            }

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

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            html: `
                    <div style="max-width: 480px; margin: 30px auto; background: #fff; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.06); font-family: Arial, sans-serif; color: #444;">
  <div style="background: linear-gradient(135deg, #c0392b, #922b21); padding: 24px; text-align: center; color: #fff; font-weight: 600; font-size: 22px;">
    Password Reset Request
  </div>
  <div style="padding: 24px; font-size: 14px; line-height: 1.5;">
    <p>Hello ${user.fullName},</p>
    <p>We received a request to reset your password. Click the button below to proceed. This link expires in 5 minutes.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${resetUrl}" target="_blank" style="background: linear-gradient(90deg, #c0392b, #922b21); color: #fff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p>If you didn’t request this, please ignore this email.</p>
  </div>
  <div style="background-color: #000; padding: 8px 14px; text-align: center; font-size: 12px; color: #fff; line-height: 1.2;">
    Designed and developed by Mr. Rohit Ranjan
    <a href="https://www.linkedin.com/in/csrohitranjan" target="_blank" rel="noopener noreferrer" style="display: inline-block; vertical-align: middle; margin-left: 6px;">
      <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style="width: 12px; height: 12px; opacity: 0.8; vertical-align: middle;" />
    </a>
  </div>
</div>            
            `,
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






export { requestRegistration, confirmRegistration, loginUser, updateUserProfile, changePassword, requestPasswordReset, resetPassword }