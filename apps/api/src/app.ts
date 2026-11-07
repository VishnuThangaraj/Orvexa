import express, { Application, Request, Response } from "express";
import env from "./config/env.js";
import "./common/utils/bigint.js";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping
app.get("/", (req: Request, res: Response) => {
  const origin: string = (req.headers.origin as string) || "Unknown Origin";
  console.log(`Ping requested from : ${origin}`);
  res.send(`Orvexa - Server Running Version : ${env.PROJECT_VERSION}`);
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    version: env.PROJECT_VERSION,
    timestamp: new Date().toISOString(),
  });
});

export default app;
