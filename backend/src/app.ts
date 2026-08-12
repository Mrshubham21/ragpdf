import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://ragpdf-three.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow known origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all Vercel deployment URLs for this project
      if (
        origin.endsWith(".vercel.app") &&
        origin.includes("ragpdf")
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

export default app;