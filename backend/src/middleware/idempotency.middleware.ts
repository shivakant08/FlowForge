import {Request, Response, NextFunction} from "express"
import {prisma} from "../config/database"
import { success } from "zod"

export const enforceIdempotency = async(req: Request, res:Response,next: NextFunction)=>{
    const idempotencyKey = req.headers["idempotency-key"] as string
    if(!idempotencyKey){
        return next()
    }

    try {
        const existingLog = await prisma.auditLog.findFirst({
            where:{
                organizationId: req.user!.organizationId,
                entityType: "IDEMPOTENCY_KEY",
                entityId: idempotencyKey
            }
        })

        if(existingLog && existingLog.newValue){
            return res.status(200).json(existingLog.newValue)
        }

        (req as any).idempotencyKey = idempotencyKey
        return next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            error:"Failed to verify idempotency state."
        })
    }
}