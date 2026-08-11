import mongoose, { Document as MongooseDocument, Schema } from "mongoose";

export interface IDocument extends MongooseDocument {
  fileName: string;
  originalName: string;
  filePath: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  uploadedBy: mongoose.Types.ObjectId;
}

const documentSchema = new Schema<IDocument>(
  {
    fileName: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDocument>(
  "Document",
  documentSchema
);