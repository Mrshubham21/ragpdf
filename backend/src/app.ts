import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ragpdf-three.vercel.app",
      "https://ragpdf-93dvdtff6-st689801-6062s-projects.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

export default app;