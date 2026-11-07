import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./infrastructure/database/prisma.js";

const bootstrap = async () => {
  const PORT = env.PORT;

  try {
    // Connect to Database
    await connectDatabase();

    // App Server
    const server = app.listen(PORT, () => {
      console.log(`>>> Orvexa Server Running on PORT : ${PORT}`);
    });

    // Graceful Shutdown
    let isShuttingDown = false;
    const shutdown = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`Signal Received ${signal}, Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disconnectDatabase();
          console.log("[SERVER] Database connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("[SERVER] Error closing database connection:", err);
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
