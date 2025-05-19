import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join("public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { paperCode, month, year } = req.body;

    const code = paperCode?.trim().replace(/\s+/g, "") || "NoCode";
    const paperMonth = month?.trim().replace(/\s+/g, "-") || "NoMonth";
    const paperYear = year?.toString().trim() || "NoYear";

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const uniquePart = `${timestamp}-${random}`;

    const filename = `${code}-${paperMonth}-${paperYear}-${uniquePart}.pdf`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const uploadPDFonlocal = multer({ storage, fileFilter });

export default uploadPDFonlocal;
