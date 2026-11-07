import app from "./app";

import env from "./config/env";

const bootstrap = async () => {
  const PORT = env.PORT;

  try {
    // App Server
    const server = app.listen(PORT, () => {
      console.log(`>>> Orvexa Server Running on PORT : ${PORT}`);
    });

    // Shutdown
    const shutdown = (signal: string) => {
      console.log(`Signal Received ${signal}, Shutting down gracefully...`);

      server.close(async () => {
        try {
          console.log("[SERVER] Database connection closed.");
        } catch (err) {
          console.error("[SERVER] Error closing database connection:", err);
        }
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.log(`>>> Failed to Start Orvexa Server on Port : ${PORT}`);
    console.log(error);

    process.exit(1);
  }
};

bootstrap();
