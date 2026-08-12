import { Response } from "express";
import Document from "../models/Document";
import { redisClient } from "../config/redis";

export const uploadDocument = async (
  req: any,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const document = await Document.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      status: "uploaded",
    });

    await redisClient.publish(
      "pdf-processing",
      JSON.stringify({
        documentId: document._id.toString(),
        filePath: document.filePath,
      })
    );

    return res.status(201).json({
      success: true,
      document,
    });

  } catch (error) {
    console.error("Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};