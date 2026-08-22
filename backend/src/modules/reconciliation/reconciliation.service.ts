import {prisma} from "../../config/database"
import { Prisma } from "@prisma/client"


export interface BankStatementRow{
    transactionDate: Date;
    description: string;
    amount: number;
    referenceNo?: string
}

export class ReconciliationService{
    async processSatement(organizationId: string, filename: string, rows :BankStatementRow[]){
        return await prisma.$transaction(async (tx: Prisma.TransactionClient)=>{
            const statement = await tx.bankStatement.create({
                data:{organizationId, filename}
            })

            let matchedCount = 0

            for(const row of rows){
                const matchingEntry = await tx.ledgerEntry.findFirst({
                    where:{
                        account: {organizationId},
                        amount: new Prisma.Decimal(row.amount),
                        reconciliationItem:null
                    }
                })

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