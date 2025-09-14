import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
    {
        paperName: {
            type: String,
            required: true,
            trim: true,
        },
        paperCode: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        programme: {
            type: String,
            required: true,
            trim: true,
        },
        month: {
            type: String,
            trim: true,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
            trim: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        remark: {
            type: String,
            trim: true,
            default: "", // only filled when rejected
        },
    },
    { timestamps: true }
);

export const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);
