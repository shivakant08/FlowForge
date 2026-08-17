import {Router } from "express"
import { AuthController } from "./auth.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { requireRole } from "../../middleware/rbac.middleware"

const router = Router()
const controller = new AuthController()

router.post("/register", (req, res)=>controller.register(req, res))
router.post("/login", (req, res)=>controller.login(req, res))
router.post("/users", authenticate, requireRole(["ORG_ADMIN"]), (req, res)=>controller.createUser(req, res))
router.post("/refresh", (req, res)=>controller.refresh(req, res))
router.post("/logout", (req, res)=>controller.logout(req,res ))

router.get("/me", authenticate, requireRole(["ORG_ADMIN", "HEAD_ACCOUNTANT", "ACCOUNTANT"]),
(req, res)=> controller.getProfile(req, res))

export default router

// d7f94450-4922-40be-a74f-6b0e9dd7fb3a

// cb469a98-87dc-4731-904a-0c80772860dc