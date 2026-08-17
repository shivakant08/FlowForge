import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const TRANSACTION_QUEUE_NAME = "transaction-events"

export const transactionQueue= new Queue(TRANSACTION_QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions:{
        attempts:3,
        backoff:{
            type:"exponential",
            delay:1000,
        },
        removeOnComplete: true
    }
})

export interface TransactionEventPayload{
    transactionId: string;
    organizationId: string;
    userId: string;
    type: "CREATED" | "APPROVED" | "REJECTED";
    amount: number;
}

export const dispatchTransactionEvent= async (payload:TransactionEventPayload)=>{
    await transactionQueue.add(`event: ${payload.type}`, payload)
}