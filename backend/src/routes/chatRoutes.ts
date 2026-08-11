import express from "express";
import { protect } from "../middleware/authMiddleware";
import { askQuestion } from "../controllers/chatController";

const router = express.Router();

router.post(
  "/ask",
  protect,
  askQuestion
);

export default router;