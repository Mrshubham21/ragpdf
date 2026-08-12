import { Request, Response } from "express";
import axios from "axios";

export const askQuestion = async (
  req: Request,
  res: Response
) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    const PYTHON_AI_URL =
      process.env.PYTHON_AI_URL ||
      "http://127.0.0.1:8000";

    console.log("Calling Python AI:", PYTHON_AI_URL);

    const response = await axios.post(
      `${PYTHON_AI_URL}/ask`,
      {
        question,
        documentId,
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "Python AI Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get answer",
    });
  }
};