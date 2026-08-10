import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
import { treeifyError } from "zod";

interface TokenPayload{
    userId: string;
    organizationId: string;
    role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction)=>{
     const authHeader = req.headers.authorization
     if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success: false,
            error: "Authentication token missing or malformed."
        })
     }
     const token = authHeader.split(" ")[1]

     try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload
        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role
        }
        return next()
     } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token."
        })
     }
}