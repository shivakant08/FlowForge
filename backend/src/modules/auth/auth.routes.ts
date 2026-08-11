import {Router } from "express"
import { AuthController } from "./auth.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { requireRole } from "../../middleware/rbac.middleware"

const router = Router()
const controller = new AuthController()

router.post("/register", (req, res)=>controller.register(req, res))
router.post("/login", (req, res)=>controller.login(req, res))
router.post("/refresh", (req, res)=>controller.refresh(req, res))
router.post("/logout", (req, res)=>controller.logout(req,res ))

router.get("/me", authenticate, requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]),
(req, res)=> controller.getProfile(req, res))

export default router