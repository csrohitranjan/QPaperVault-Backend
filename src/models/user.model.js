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
        },
        mobileNumber: {
            type: String,
            // required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            // required: true,
            // trim: true,
        },
        programme: {
            type: String,
            // required: true,
            // trim: true,
        },
        enrollmentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        otp: {
            type: String,
            default: null,
        },
        isBlocked: {
            type: Boolean,
            default: false, // blocks login
        },
        isUploadBanned: {
            type: Boolean,
            default: false, // blocks uploading papers
        },
        role: {
            type: String,
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
