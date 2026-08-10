import {Router } from "express"
import { AuthController } from "./auth.controller"

const router = Router()
const controller = new AuthController()

router.post("/register", (req, res)=>controller.register(req, res))
router.post("/refresh", (req, res)=>controller.refresh(req, res))

export default router