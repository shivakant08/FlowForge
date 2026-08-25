import { Worker, Job } from "bullmq";
import { TRANSACTION_QUEUE_NAME, TransactionEventPayload, isRedisAvailable } from "../queues/transaction.queue";
import { redisConfig } from "../config/redis";
import { prisma } from "../config/database"

export const startNotificationWorker = async () => {
    const redisReady = await isRedisAvailable()

    if (!redisReady) {
        console.warn("[Worker] Redis unavailable. Background notification worker disabled.")
        return null
    }

    try {
        const worker = new Worker<TransactionEventPayload>(
            TRANSACTION_QUEUE_NAME,
            async (job: Job<TransactionEventPayload>) => {
                const { transactionId, userId, type, amount } = job.data

                await prisma.notification.create({
                    data: {
                        userId,
                        type: `TRANSACTION_${type}` as any,
                        title: `TRANSACTION ${type.toLocaleLowerCase()}`,
                        message: `Transaction ${transactionId} for ${amount} was ${type.toLocaleLowerCase()}.`
                    }
                })
                console.log(`[Worker] Processed ${type} notification for TX: ${transactionId}`)
            },
            {
                connection: {
                    ...redisConfig,
                    lazyConnect: true,
                    enableOfflineQueue: true,
                },
            }
        )

        worker.on("failed", (job, err) => {
            console.error(`[Worker Error] Job ${job?.id} failed with error: ${err.message}`)
        })

        return worker
    } catch (error) {
        console.warn("[Worker] Failed to start the background worker.", error instanceof Error ? error.message : error)
        return null
    }
}