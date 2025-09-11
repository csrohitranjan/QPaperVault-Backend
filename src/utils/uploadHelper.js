import cloudinary from './cloudinary.js';
import fs from 'fs';

export const uploadOnCloudinary = async (pdfFilePath, originalFilename) => {
    if (!pdfFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(pdfFilePath, {
            resource_type: 'raw',
            type: 'private',
            public_id: `${process.env.CLOUDINARY_FOLDER_NAME}/${process.env.CLOUDINARY_SUBFOLDER_NAME}/${originalFilename}`, // Save inside folder in the Cloudinary.
        });
        return response;
    } catch (error) {
        console.log("File Upload Failed on Cloudinary:", error);
        return null;
    } finally {
        try {
            fs.unlinkSync(pdfFilePath);
            console.log("Local File Deleted Successfully");
        } catch (error) {
            console.log("Error Deleting Local File:", error);
        }
    }
};