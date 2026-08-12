import { createClient } from "redis";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const subscriber = createClient({
  url: process.env.REDIS_URL,
});

export const startSubscriber = async () => {
  await subscriber.connect();

  console.log("✅ Redis PDF subscriber connected");

  await subscriber.subscribe(
    "pdf-processing",
    async (message) => {
      try {
        console.log("\n==============================");
        console.log("📄 PDF PROCESSING JOB");
        console.log("==============================");

        const data = JSON.parse(message);

        console.log("Document ID:", data.documentId);
        console.log("File Path:", data.filePath);

        const pythonUrl =
          process.env.PYTHON_AI_URL ||
          "http://127.0.0.1:8000";

        console.log("🐍 Python AI:", pythonUrl);

        // Check PDF exists on Node server
        if (!fs.existsSync(data.filePath)) {
          console.error(
            "❌ PDF file not found:",
            data.filePath
          );
          return;
        }

        // =================================
        // 1. Upload PDF to Python
        // =================================

        const form = new FormData();

        form.append(
          "file",
          fs.createReadStream(data.filePath)
        );

        form.append(
          "documentId",
          String(data.documentId)
        );

        console.log("📤 Uploading PDF to Python...");

        const uploadResponse = await axios.post(
          `${pythonUrl}/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        console.log(
          "✅ Python upload:",
          uploadResponse.data
        );

        // =================================
        // 2. Process PDF
        // =================================

        console.log("🔄 Processing PDF...");

        const processResponse = await axios.post(
          `${pythonUrl}/process-pdf`,
          {
            documentId: String(data.documentId),
          }
        );

        console.log(
          "✅ Python processing:",
          processResponse.data
        );

        console.log(
          "🎉 PDF processing completed successfully"
        );

      } catch (error: any) {
        console.error(
          "❌ PDF processing error:",
          error.response?.data || error.message
        );
      }
    }
  );
};