import { Prisma } from "../../../generated/prisma/client";
import { prisma, } from "../../config/database";
import { CreateTransactionInput } from "./transactions.schema";

export class TransactionsService {
    async createTransaction(organizationId: string, userId: string, input: CreateTransactionInput) {
        const { description, currency, entries } = input

        const totalAmount = entries.filter((e) => e.entryType === "DEBIT").reduce((sum, e) => sum + e.amount, 0)
        const accountIds = [...new Set(entries.map((e) => e.accountId))]

        return await prisma.$transaction(async (tx) => {
            const accounts = await tx.account.findMany({
                where: {
                    id: { in: accountIds },
                    organizationId
                }
            })

            if (accounts.length !== accountIds.length) {
                throw new Error("One or more accounts do not exists or belong to another organization.")
            }

            const accountMap = new Map(accounts.map((acc) => [acc.id, acc]))

            const transaction = await tx.transaction.create({
                data:{
                    organizationId,
                    createdById: userId,
                    amount: new Prisma.Decimal(totalAmount),
                    currency,
                    description,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                }
            })

            for(const entry of entries){
                const account = accountMap.get(entry.accountId)!
                const entryAmount = new Prisma.Decimal(entry.amount)

                await tx.ledgerEntry.create({
                    data:{
                        transactionId: transaction.id,
                        accountId: entry.accountId,
                        entryType: entry.entryType,
                        amount: entryAmount,
                     
                    }
                })

                let balanceAdjustment = new Prisma.Decimal(0)
                const isDebit = entry.entryType === "DEBIT"

                if(account.type === "ASSET" || account.type === "EXPENSE"){
                    balanceAdjustment = isDebit ? entryAmount: entryAmount.negated()
                }else{
                    balanceAdjustment = isDebit ? entryAmount.negated(): entryAmount
                }

                await tx.account.update({
                    where:{id: account.id},
                    data:{
                        balance:{
                            increment: balanceAdjustment,
                        }
                    }
                })
            }

            await tx.auditLog.create({
                data:{
                    organizationId,
                    userId,
                    transactionId: transaction.id,
                    action: "COMPLETED",
                    entityType: "TRANSACTION",
                    entityId: transaction.id,
                    newValue:{
                        amount: totalAmount,
                        description,
                        entriesCount: entries.length,
                    }
                }
            })
            return transaction
        })
    }

    async getTransaction(organizationId: string){
        return await prisma.transaction.findMany({
            where:{organizationId},
            include:{
                createdBy:{select:{id:true, name: true, email: true}},
                ledgerEntries: {
                    include:{
                        account: {select :{id: true, name: true, type: true}},
                    }
                }
            },
            orderBy: {createdAt: "desc"}
        })
    }

    async submitApproval(organizationId: string, userId:string, input: {description: string; currency?: string;amount:number}){
        return await prisma.$transaction(async (tx)=>{
            const transaction = await tx.transaction.create({
                data:{
                    organizationId,
                    createdById:userId,
                    amount:new Prisma.Decimal(input.amount),
                    currency: input.currency || "INR",
                    description: input.description,
                    status: "PENDING_APPROVAL"
                }
            })

            await tx.auditLog.create({
                data:{
                    organizationId,
                    userId,
                    transactionId: transaction.id,
                    action:"CREATED",
                    entityType:"TRANSACTION",
                    entityId: transaction.id,
                    newValue:{status:"PENDING_APPROVAL", amount: input.amount}
                }
            })
            return transaction
        })
    }

    async approveTransaction(organizationId: string, approverId: string, transactionId: string, entries: Array<{accountId: string; entryType:"DEBIT" | "CREDIT"; amount: number}>, idempotencyKey?: string){
        return await prisma.$transaction(async (tx)=>{
            const transaction = await tx.transaction.findFirst({
                where:{id: transactionId, organizationId}
            })

            if(!transaction){
                throw new Error("Transaction not found.")
            }

            if(transaction.status !== "PENDING_APPROVAL"){
                throw new Error(`Cannot approve transaction in status '${transaction.status}'`)
            }

            const accountIds = [...new Set(entries.map((e)=>e.accountId))]
            const accounts = await tx.account.findMany({
                where:{id:{in:accountIds}, organizationId}
            })

            if(accounts.length !== accountIds.length){
                throw new Error("Invalid accounts specified for ledger entry posting.")
            }

            const accountMap = new Map(accounts.map((acc)=>[acc.id, acc]))

            for(const entry of entries){
                const account = accountMap.get(entry.accountId)
                const entryAmount = new Prisma.Decimal(entry.amount)

                await tx.ledgerEntry.create({
                    data:{
                        transactionId: transaction.id,
                        accountId: entry.accountId,
                        entryType: entry.entryType, 
                        amount: entryAmount
                    }
                })

                let  balanceAdjustment = new Prisma.Decimal(0)
                const isDebit = entry.entryType === "DEBIT"

                if(account?.type === "ASSET" || account?.type === "EXPENSE"){
                    balanceAdjustment = isDebit ? entryAmount : entryAmount.negated()
                }else{
                    balanceAdjustment = isDebit ? entryAmount.negated(): entryAmount
                }

                await tx.account.update({
                    where:{id: account?.id},
                    data:{balance:{increment:balanceAdjustment}}
                })
            }

            const updatedTransaction = await tx.transaction.update({
                where:{id: transaction.id},
                data:{
                    status:"COMPLETED",
                    approvedById: approverId,
                    approvedAt: new Date(),
                    completedAt: new Date()
                }
            })

            const resultPayload = {success: true, data: updatedTransaction}
            await tx.auditLog.create({
                data:{
                    organizationId,
                    userId:approverId,
                    transactionId: transaction.id,
                    action: "APPROVED",
                    entityType:"TRANSACTION",
                    entityId: transaction.id,
                    newValue: resultPayload as any
                }
            })

            if(idempotencyKey){
                await tx.auditLog.create({
                    data:{
                        organizationId,
                        userId: approverId,
                        action:"COMPLETED",
                        entityType:"IDEMPOTENCY_KEY",
                        entityId:idempotencyKey,
                        newValue: resultPayload as any
                    }
                })
            }
            return updatedTransaction
        })
    }

    async rejectTransaction(organizationId: string, userId: string, transactionId: string){
        return await prisma.$transaction(async (tx)=>{
            const transaction = await tx.transaction.findFirst({
                where:{id: transactionId, organizationId}
            })

            if(!transaction || transaction.status !== "PENDING_APPROVAL"){
                throw new Error("Transaction cannot be rejected in its current state.")
            }

            const updated = await tx.transaction.update({
                where:{id: transaction.id},
                data:{status:"REJECTED"}
            })

            await tx.auditLog.create({
                data:{
                    organizationId,
                    userId,
                    transactionId: transaction.id,
                    action: "REJECTED",
                    entityType:"TRANSACTION",
                    entityId: transaction.id
                }
            })
            return updated
        })
    }
}