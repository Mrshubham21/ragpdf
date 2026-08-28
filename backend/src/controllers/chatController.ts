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

    console.log("=================================");
    console.log("ASK QUESTION");
    console.log("Python AI:", PYTHON_AI_URL);
    console.log("Document ID:", documentId);
    console.log("Question:", question);
    console.log("=================================");

    const response = await axios.post(
      `${PYTHON_AI_URL}/ask`,
      {
        question,
        documentId,
      },
      {
        responseType: "stream",
        timeout: 120000,
      }
    );

    console.log("✅ Connected to Python AI stream");

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    response.data.on("data", (chunk: Buffer) => {
      res.write(chunk);
    });

    response.data.on("end", () => {
      console.log("✅ Python AI stream finished");
      res.end();
    });

    response.data.on("error", (error: Error) => {
      console.error(
        "❌ Python AI stream error:",
        error.message
      );

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Python AI stream failed",
        });
      } else {
        res.end();
      }
    });

  } catch (error: any) {
    console.error(
      "❌ Python AI Error:",
      error.response?.data || error.message
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to get answer",
      });
    }

    res.end();
  }
};