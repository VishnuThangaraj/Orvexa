import http from "node:http";
import app from "./app.js";
import env from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./infrastructure/database/prisma.js";
import {
  initializeSocketServer,
  closeSocketServer,
} from "./sockets/socket.server.js";
import {
  startTrashPurgeWorker,
  stopTrashPurgeWorker,
} from "./modules/drive/drive.worker.js";

const bootstrap = async () => {
  const PORT = env.PORT;

  try {
    // Connect to Database
    await connectDatabase();

    // Create HTTP Server & Initialize WebSocket Server
    const httpServer = http.createServer(app);
    initializeSocketServer(httpServer);

    httpServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[SERVER ERROR] Port ${PORT} is already in use by another process. Please free port ${PORT} or configure a different PORT in .env.`,
        );
      } else {
        console.error("[SERVER ERROR] HTTP server error:", err);
      }
      process.exit(1);
    });

    // Start Server
    httpServer.listen(PORT, () => {
      console.log(`Orvexa Server Running on PORT : ${PORT}`);
      startTrashPurgeWorker();
    });

    // Graceful Shutdown
    let isShuttingDown = false;
    const shutdown = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`Signal Received ${signal}, Shutting down gracefully...`);
      stopTrashPurgeWorker();

      httpServer.close(async () => {
        try {
          await closeSocketServer();
          await disconnectDatabase();
          console.log("[SERVER] Socket.IO and Database connections closed.");
          process.exit(0);
        } catch (err) {
          console.error("[SERVER] Error during shutdown:", err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("[SERVER] Forced shutdown timed out.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error(`>>> Failed to Start Orvexa Server on Port : ${PORT}`);
    console.error(error);

    process.exit(1);
  }
};

bootstrap();
