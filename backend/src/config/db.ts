import mongoose from "mongoose";
import process from "process";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error);

    process.exit(1);
  }
};