import {Request, Response} from "express"
import { AuthService } from "./auth.service"
import {registerSchema, refreshSchema} from "./auth.schema"
import { success } from "zod"

const authService = new AuthService()

export class AuthController{
    async register(req: Request, res: Response){
        try {
            const validateInput = registerSchema.parse(req.body)
            const result = await authService.register(validateInput)
            return res.status(201).json({success: true, data: result})
        } catch (error: any) {
            return res.status(400).json({success: false, error: error.message})
        }
    }

    async refresh(req: Request, res: Response){
try {
        const {refreshToken} = refreshSchema.parse(req.body)
        const tokens = await authService.refreshToken(refreshToken)
        return res.status(200).json({success: true, data: tokens})
} catch (error:any) {
    return res.status(401).json({success: false, error: error.message})
}
    }
}