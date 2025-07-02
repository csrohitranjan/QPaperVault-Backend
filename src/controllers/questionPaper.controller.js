import path from "path";
import { QuestionPaper } from "../models/questionpaper.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { formatPaperName, formatMonth } from "../utils/formatUtils.js";
import fs from "fs";

export const uploadQuestionPaper = async (req, res) => {
    const filePath = req.file.path;
    try {
        const user = req.user;

        // Check if the user is banned from uploading
        if (user.isUploadBanned) {
            return res.status(403).json({
                status: 403,
                message: "You are not allowed to upload question papers. Please contact an administrator."
            });
        }

        // Check for required profile fields
        if (!user.phoneNumber || !user.department || !user.programme) {
            return res.status(400).json({
                status: 400,
                message: "Please update your profile before uploading."
            });
        }

        let { paperName, paperCode, department, programme, month, year } = req.body;

        if (!paperName || !paperCode || !department || !programme || !month || !year || !req.file) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required."
            });
        }

        // Cleaning all data befor saving to the DB.

        paperName = formatPaperName(paperName);
        month = formatMonth(month);
        paperCode = paperCode.replace(/\s+/g, '').toUpperCase();
        department = department.replace(/\s+/g, '').toUpperCase();
        programme = programme.replace(/\s+/g, '').toUpperCase();

        // Checking is this Question paper already available.
        const existingPaper = await QuestionPaper.findOne({
            paperCode,
            department,
            programme,
            month,
            year,
        });

        if (existingPaper) {
            return res.status(409).json({
                status: 409,
                message: "This question paper already exists in the system.",
            });
        }

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
    } finally {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("Local file deleted after upload attempt.");
            } catch (err) {
                console.log("Failed to delete local file:", err.message);
            }
        }
    }
};


export const getPendingQuestionPapers = async (req, res) => {
    try {
        const pendingPapers = await QuestionPaper.find({ status: "pending" })
            .populate("uploadedBy", "fullName enrollmentNumber email role")
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
        const { questionPaperId } = req.params;
        const { remark } = req.body; // optional remark on approval

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
        paper.remark = remark ? remark.trim() : ""; // clear remark or set if provided

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


export const rejectQuestionPaper = async (req, res) => {
    try {
        const user = req.user; // admin user from middleware
        const { questionPaperId } = req.params;
        const { remark } = req.body;

        if (!questionPaperId) {
            return res.status(400).json({
                status: 400,
                message: "Question paper ID is required.",
            });
        }

        if (!remark || remark.trim() === "") {
            return res.status(400).json({
                status: 400,
                message: "Rejection remark is required.",
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
                message: "This question paper has already been reviewed.",
            });
        }

        paper.status = "rejected";
        paper.remark = remark.trim();
        paper.approvedBy = user._id;

        await paper.save();

        return res.status(200).json({
            status: 200,
            message: "Question paper rejected successfully.",
            rejectedPaper: paper,
        });
    } catch (error) {
        console.error("Error rejecting question paper:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error while rejecting question paper.",
            error: error.message,
        });
    }
};


export const getApprovedQuestionPapers = async (req, res) => {
    try {
        const approvedPapers = await QuestionPaper.find({ status: "approved" })
            .populate("uploadedBy", "fullName -_id") // optional: fetch uploader info only fullName, exclude _id
            .select("-approvedBy -status -remark -createdAt -updatedAt -__v")
            .sort({ year: -1, month: -1, createdAt: -1 }) // most recent papers first
            .lean();
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



export const getUserUploadedQuestionPapers = async (req, res) => {
    try {
        const userId = req.user._id;

        const uploadedPapers = await QuestionPaper.find({ uploadedBy: userId })
            .sort({ createdAt: -1 }) // newest first
            .select("-__v") // exclude version key if you want
            .populate("approvedBy", "fullName email role") // optional: info on who approved/rejected

        return res.status(200).json({
            status: 200,
            message: "Fetched your uploaded question papers successfully.",
            uploadedPapers,
        });
    } catch (error) {
        console.error("Error fetching user's uploaded question papers:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error while fetching uploaded question papers.",
            error: error.message,
        });
    }
};

