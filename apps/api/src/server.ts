/// <reference path="./types/express.d.ts" />
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma/client";
import { logger } from "./utils/logger";

const PORT = parseInt(env.PORT, 10);

async function main() {
  // Verify DB connection before starting
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (err) {
    logger.error({ err }, "Failed to connect to database");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`EventPulse API running on http://localhost:${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
