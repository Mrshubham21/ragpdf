import express from "express";
import { upload } from "../middleware/uploadMiddleware";
import { protect } from "../middleware/authMiddleware";
import { uploadDocument } from "../controllers/documentController";

const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadDocument
);

export default router;