import { Request, Response } from "express"
import { AuthService } from "./auth.service"
import { registerSchema, refreshSchema } from "./auth.schema"
import { loginSchema } from "./auth.schema"
import { success } from "zod"

const authService = new AuthService()

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const validateInput = registerSchema.parse(req.body)
            const result = await authService.register(validateInput)
            return res.status(201).json({ success: true, data: result })
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message })
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = refreshSchema.parse(req.body)
            const tokens = await authService.refreshToken(refreshToken)
            return res.status(200).json({ success: true, data: tokens })
        } catch (error: any) {
            return res.status(401).json({ success: false, error: error.message })
        }
    }

    async login(req: Request, res: Response){
        try {
            const validatedInput = loginSchema.parse(req.body)
            const result = await authService.login(validatedInput)
            return res.status(200).json({
                success:true,
                data: result
            })
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                error: error.message
            })
        }
    }

    async logout(req: Request, res: Response){
        try {
            const {refreshToken} = req.body
            if(!refreshToken){
                return res.status(400).json({success:false, error: "Refresh token required."})
            }
            await authService.logout(refreshToken)
            return res.status(200).json({success: true, message: "Logged out successfully."})
        } catch (error:any) {
            return res.status(500).json({success: false, error: error.message})
        }
    }

    async getProfile(req: Request, res:Response){
        return res.status(200).json({
            success: true,
            data:{
                user: req.user
            }
        })
    }

    async createUser(req: Request, res: Response){
        try {
            const organizationId = req.user!.organizationId
            const result = await authService.createUser(organizationId, req.body)
            return res.status(201).json({
                success: true,
                data: result
            })
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }


}