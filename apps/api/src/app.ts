import express, { Application, Request, Response } from "express";
import env from "./config/env.js";
import "./common/utils/bigint.js";
import cloudinary from "./config/cloudinary.js";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping
app.get("/", (req: Request, res: Response) => {
  const origin: string = (req.headers.origin as string) || "Unknown Origin";
  console.log(`Ping requested from : ${origin}`);
  res.send(`Orvexa - Server Running Version : ${env.PROJECT_VERSION}`);
});

// API Health
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    version: env.PROJECT_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// Cloudinary Health
app.get("/health/cloudinary", async (_req: Request, res: Response) => {
  const result = await cloudinary.api.ping();

  res.status(200).json({
    success: true,
    message: `Cloudinary connected Successfully`,
    status: result.status,
  });
});

export default app;
