import {Request, Response, NextFunction} from "express"
import {getHealth} from "./health.service"

export async function healthController(req: Request, res: Response, next :NextFunction){
    try{
        const health = await getHealth()
        return res.status(200).json({
            success: true,
            data: health
        })
    } catch (error) {
        next(error)
    }
}