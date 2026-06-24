/// <reference path="./types/express.d.ts" />
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma/client";

const PORT = parseInt(env.PORT, 10);

async function main() {
  // Verify DB connection before starting
  try {
    await prisma.$connect();
    console.log("✅  Database connected");
  } catch (err) {
    console.error("❌  Failed to connect to database:", err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀  EventPulse API running on http://localhost:${PORT}`);
    console.log(`📌  Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("✅  Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
