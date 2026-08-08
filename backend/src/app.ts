import express from "express"
import cors from "cors"
import helmet from "helmet"

import healthRoutes from "./modules/health/health.routes"
import { notFoundMiddleware } from "./middleware/not-found.middleware"
import { errorMiddleware } from "./middleware/error.middleware"

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(express.urlencoded({extended: true}))

//ROUTES
app.use("/api/v1/health", healthRoutes)

//404
app.use(notFoundMiddleware)

//ERROR
app.use(errorMiddleware)

export default app