import { Queue } from "bullmq";
import Redis, { RedisOptions } from "ioredis";
import { redisConfig } from "../config/redis";

export const TRANSACTION_QUEUE_NAME = "transaction-events"

let transactionQueue: Queue | null = null

export async function isRedisAvailable() {
    const redisOptions: RedisOptions = {
        ...(redisConfig as RedisOptions),
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
    }

    const client = new Redis(redisOptions)

    try {
        await client.ping()
        return true
    } catch {
        return false
    } finally {
        await client.quit().catch(() => undefined)
    }
}

export function getTransactionQueue() {
    if (transactionQueue) {
        return transactionQueue
    }

    if (process.env.DISABLE_REDIS === "true") {
        return null
    }

    const queue = new Queue(TRANSACTION_QUEUE_NAME, {
        connection: {
            ...redisConfig,
            lazyConnect: true,
            enableOfflineQueue: true,
        },
        defaultJobOptions:{
            attempts:3,
            backoff:{
                type:"exponential",
                delay:1000,
            },
            removeOnComplete: true
        }
    })

    transactionQueue = queue
    return queue
}

export interface TransactionEventPayload{
    transactionId: string;
    organizationId: string;
    userId: string;
    type: "CREATED" | "APPROVED" | "REJECTED";
    amount: number;
}

export const dispatchTransactionEvent = async (payload: TransactionEventPayload) => {
    const queue = getTransactionQueue()

    if (!queue) {
        return
    }

    try {
        await queue.add(`event: ${payload.type}`, payload)
    } catch (error) {
        console.warn("[Queue] Redis unavailable; skipping event dispatch.", error instanceof Error ? error.message : error)
    }
}