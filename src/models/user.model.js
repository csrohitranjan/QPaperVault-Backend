import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                "Please enter a valid email address"
            ]
        },
        phoneNumber: {
            type: String,
            unique: true,
            sparse: true, // optional but helps with null values being allowed
            match: [
                /^\+?[1-9]\d{1,14}$/,
                "Please enter a valid phone number"
            ]
        },
        password: {
            type: String,
            required: true,
        },
        department: {
            type: String,
        },
        programme: {
            type: String,
        },
        enrollmentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        otp: {
            type: String,
        },
        isBlocked: {
            type: Boolean,
            required: true,
            default: false, // blocks login
        },
        isUploadBanned: {
            type: Boolean,
            required: true,
            default: false, // blocks uploading papers
        },
        role: {
            type: String,
            required: true,
            enum: ["student", "educator", "admin"],
            default: "student",
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
