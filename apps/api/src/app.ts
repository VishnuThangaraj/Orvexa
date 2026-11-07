import express, { Application, Request, Response } from "express";
import env from "./config/env";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping
app.get("/", (req: Request, res: Response) => {
  const origin: String = req.headers.origin || "Unknown Origin";
  console.log(`Ping requested from : ${origin}`);
  res.send(`Orvexa - Server Running Version : ${env.PROJECT_VERSION}`);
});

export default app;
