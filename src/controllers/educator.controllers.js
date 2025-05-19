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
        const isEducator = user.role === "educator";

        console.log(isEducator)
        const uploadedPaper = await QuestionPaper.create({
            paperName,
            paperCode,
            department,
            programme,
            month,
            year,
            fileUrl: uploadResult.secure_url,
            uploadedBy: user._id,
            approvedBy: isEducator ? user._id : null,
            status: isEducator ? "approved" : "pending",
        });

        return res.status(201).json({
            status: 201,
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
