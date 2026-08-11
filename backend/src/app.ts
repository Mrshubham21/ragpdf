import express from "express";
import authRoutes from "./routes/authRoutes";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";
const app = express();

app.use(express.json()); // FIRST

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes); // AFTER
app.use("/api/documents", documentRoutes);
app.get("/", (req, res) => {
  res.send("PDF RAG Chatbot API Running...");
});

export default app;