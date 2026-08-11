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

    const response = await axios.post(
  "http://127.0.0.1:8000/ask",
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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get answer",
    });
  }
};