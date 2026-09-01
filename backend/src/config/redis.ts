import { ConnectionOptions } from "bullmq";

export const redisConfig: ConnectionOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    maxRetries: 1,
    retryDelay: 1000,
    lazyConnect: true,
    enableOfflineQueue: true,
}