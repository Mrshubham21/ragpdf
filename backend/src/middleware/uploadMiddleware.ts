import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads"
);

// Make sure uploads directory exists
fs.mkdirSync(UPLOAD_DIR, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const uniqueName =
      Date.now() +
      "-" +
      file.originalname.replace(
        /\s+/g,
        "-"
      );

    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype ===
    "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF files are allowed"
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:
      20 * 1024 * 1024,
  },
});