import mongoose from "mongoose";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
}
