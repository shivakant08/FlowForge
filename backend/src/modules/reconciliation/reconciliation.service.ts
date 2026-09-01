import {prisma} from "../../config/database"
import { Prisma } from "@prisma/client"
import { findMatchingLedgerEntry } from "./matching.logic"


export interface BankStatementRow{
    transactionDate: Date;
    description: string;
    amount: number;
    referenceNo?: string
}

export class ReconciliationService{
    async hasStatement(organizationId: string, filename: string, fileHash?: string){
        return Boolean(await prisma.bankStatement.findFirst({
            where: {
                organizationId,
                OR: [
                    { filename },
                    ...(fileHash ? [{ fileHash }] : [])
                ]
            }
            , select: { id: true }
        }))
    }

    async processSatement(organizationId: string, filename: string, rows :BankStatementRow[], fileHash?: string){
        return await prisma.$transaction(async (tx: Prisma.TransactionClient)=>{
            const statement = await tx.bankStatement.create({
                data:{organizationId, filename, fileHash}
            })

            let matchedCount = 0

            for(const row of rows){
                const candidates = await tx.ledgerEntry.findMany({
                    where:{
                        account: {organizationId},
                        reconciliationItem:null
                    },
                    include: { transaction: true }
                })
                const matchingEntry = findMatchingLedgerEntry(candidates, row)

                if(matchingEntry){
                    await tx.reconciliationItem.create({
                        data:{
                            bankstatementId: statement.id,
                            transactionDate:row.transactionDate,
                            description: row.description,
                            amount: new Prisma.Decimal(row.amount),
                            referenceNo: row.referenceNo,
                            status:"MATCHED",
                            matchedEntryId:matchingEntry.id
                        }
                    })
                    matchedCount++
                }else{
                    await tx.reconciliationItem.create({
                        data:{
                            bankstatementId: statement.id,
                            transactionDate: row.transactionDate,
                            description: row.description,
                            amount: new Prisma.Decimal(row.amount),
                            referenceNo:row.referenceNo,
                            status:"UNMATCHED"
                        }
                    })
                }
            }

            return {
                statementId: statement.id,
                totalItems: rows.length,
                matchedCount,
                unmatchedCount: rows.length - matchedCount
            }
        })
    }

    async getStatements(organizationId: string){
        return await prisma.bankStatement.findMany({
            where:{organizationId},
            include:{
                _count:{
                    select:{items: true},
                },
                items:{
                    include:{
                        matchedEntry:{
                            include:{
                                account:true,
                                transaction:true
                            }
                        }
                    }
                }
            },
            orderBy:{uploadedAt: "desc"}
        })
    }

    async getStatementDetails(organizationId: string, statementId:string){
        const statement = await prisma.bankStatement.findFirst({
            where: {id: statementId, organizationId},
            include:{
                items:{
                    include:{
                        matchedEntry:{
                            include:{
                                account:true,
                                transaction: true
                            }
                        }
                    }
                }
            }
        })
        if(!statement){
            throw new Error("Bank statement not found.")
        }
        return statement
    }

    async manualMatch(organizationId: string, reconciliationItemId:string, ledgerEntryId: string){
        return await prisma.$transaction(async (tx: Prisma.TransactionClient)=>{
            const item = await tx.reconciliationItem.findFirst({
                where:{
                    id: reconciliationItemId,
                    bankStatement: {organizationId}
                }
            })

            if(!item){
                throw new Error("Reconciliation item not found.")
            }

            const entry = await tx.ledgerEntry.findFirst({
                where:{
                    id: ledgerEntryId,
                    account:{organizationId},
                    reconciliationItem:null
                }
            })

            if(!entry){
                throw new Error("Target ledger entry is invalid or already reconciled.")
            }

            return await tx.reconciliationItem.update({
                where:{id: reconciliationItemId},
                data:{
                    status:"MATCHED",
                    matchedEntryId: entry.id
                }
            })
        })
    }
}