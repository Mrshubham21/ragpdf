import express from "express";
import { upload } from "../middleware/uploadMiddleware";
import { uploadDocument } from "../controllers/documentController";

const router = express.Router();

router.post(
  "/upload",
  upload.single("file"),
  uploadDocument
);

export default router;