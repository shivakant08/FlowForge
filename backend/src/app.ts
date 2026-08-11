import express from "express"
import cors from "cors"
import helmet from "helmet"

import healthRoutes from "./modules/health/health.routes"
import authRoutes from "./modules/auth/auth.routes"
import accountRoutes from "./modules/accounts/accounts.routes"
import { notFoundMiddleware } from "./middleware/not-found.middleware"
import { errorMiddleware } from "./middleware/error.middleware"

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(express.urlencoded({extended: true}))

//ROUTES
app.use("/api/v1/health", healthRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/accounts", accountRoutes)

//404
app.use(notFoundMiddleware)

//ERROR
app.use(errorMiddleware)

export default app