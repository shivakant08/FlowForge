import { Worker, Job } from "bullmq";
import { TRANSACTION_QUEUE_NAME, TransactionEventPayload } from "../queues/transaction.queue";
import { redisConfig } from "../config/redis";
import { prisma } from "../config/database"

export const startNotificationWorker = () => {
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
        { connection: redisConfig }
    )

    worker.on("failed", (job, err) => {
        console.error(`[Worker Error] Job ${job?.id} failed with error: ${err.message}`)
    })

    return worker
}