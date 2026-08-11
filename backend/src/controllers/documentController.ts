import { Request, Response } from "express";
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
      uploadedBy: req.user._id,
      status: "uploaded",
    });

    await redisClient.publish(
      "pdf-processing",
      JSON.stringify({
        documentId: document._id,
        filePath: document.filePath,
      })
    );

    res.status(201).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};