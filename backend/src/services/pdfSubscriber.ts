import { createClient } from "redis";

const subscriber = createClient({
  url: process.env.REDIS_URL,
});

export const startSubscriber = async () => {
  await subscriber.connect();

  await subscriber.subscribe(
    "pdf-processing",
    async (message) => {
      console.log("PDF Job Received:", message);

      const data = JSON.parse(message);

      console.log("Document ID:", data.documentId);
      console.log("File Path:", data.filePath);
    }
  );
};