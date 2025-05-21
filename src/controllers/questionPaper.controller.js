import path from "path";
import { QuestionPaper } from "../models/questionPaper.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const uploadQuestionPaper = async (req, res) => {
    try {
        const { paperName, paperCode, department, programme, month, year } = req.body;

        if (!paperName || !paperCode || !department || !programme || !month || !year || !req.file) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required."
            });
        }

        const user = req.user;

        const filePath = req.file.path;
        const fileName = path.parse(req.file.filename).name;
        const uploadResult = await uploadOnCloudinary(filePath, fileName);

        if (!uploadResult) {
            return res.status(500).json({
                status: 500,
                message: "Failed to upload file to Cloudinary."
            });
        }

        // Determine approval status based on user role
        const isAuthorizedUser = user.role === "educator" || user.role === "admin";

        const uploadedPaper = await QuestionPaper.create({
            paperName,
            paperCode,
            department,
            programme,
            month,
            year,
            fileUrl: uploadResult.secure_url,
            uploadedBy: user._id,
            approvedBy: isAuthorizedUser ? user._id : null,
            status: isAuthorizedUser ? "approved" : "pending",
        });

        return res.status(200).json({
            status: 200,
            message: "Question paper uploaded successfully.",
            uploadedPaper,
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error while uploading question paper.",
            error: error.message
        });
    }
};


export const getPendingQuestionPapers = async (req, res) => {
    try {
        const pendingPapers = await QuestionPaper.find({ status: "pending" })
            .populate("uploadedBy", "fullName email role")
            .sort({ createdAt: 1 }); // ascending: oldest first

        return res.status(200).json({
            status: 200,
            message: "Pending question papers fetched successfully.",
            pendingPapers,
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Failed to fetch pending question papers.",
            error: error.message,
        });
    }
};


export const approveQuestionPaper = async (req, res) => {
    try {
        const user = req.user;
        const { id: questionPaperId } = req.params;

        if (!questionPaperId) {
            return res.status(400).json({
                status: 400,
                message: "Question paper ID is required in params.",
            });
        }

        const paper = await QuestionPaper.findById(questionPaperId);

        if (!paper) {
            return res.status(404).json({
                status: 404,
                message: "Question paper not found.",
            });
        }

        if (paper.status !== "pending") {
            return res.status(400).json({
                status: 400,
                message: "This question paper is already reviewed.",
            });
        }

        paper.status = "approved";
        paper.approvedBy = user._id;

        await paper.save();

        return res.status(200).json({
            status: 200,
            message: "Question paper approved successfully.",
            approvedPaper: paper,
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error while approving question paper.",
            error: error.message,
        });
    }
};


export const getApprovedQuestionPapers = async (req, res) => {
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

