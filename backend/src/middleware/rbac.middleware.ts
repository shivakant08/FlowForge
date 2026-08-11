import { Request, Response, NextFunction } from "express";
import { error } from "node:console";
import { success } from "zod";

export const requireRole= (allowedRoles: string[])=>{
    return (req: Request, res:Response, next: NextFunction)=>{
        if(!req.user){
            return res.status(401).json({success: false, error:"Unauthenticated request."})
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({
                success: false,
                error: `Forbidden. Role '${req.user.role}' lacks sufficient privileges.`
            })
        }
        return next()
    }
}