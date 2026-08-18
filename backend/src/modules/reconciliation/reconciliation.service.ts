import {prisma} from "../../config/database"
import { Prisma } from "../../../generated/prisma/client"


export interface BankStatementRow{
    transactionDate: Date;
    description: string;
    amount: number;
    referenceNo?: string
}

export class ReconciliationService{
    async processSatement(organizationId: string, filename: string, rows :BankStatementRow[]){
        return await prisma.$transaction(async (tx)=>{
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
}