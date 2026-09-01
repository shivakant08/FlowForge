import express from "express"
import cors from "cors"
import helmet from "helmet"

import healthRoutes from "./modules/health/health.routes"
import authRoutes from "./modules/auth/auth.routes"
import accountRoutes from "./modules/accounts/accounts.routes"
import analyticsRoutes from "./modules/analytics/analytics.routes"
import reconciliationRoutes from "./modules/reconciliation/reconcilation.routes"
import transactionRoutes from "./modules/transactions/transactions.routes"
import { notFoundMiddleware } from "./middleware/not-found.middleware"
import { errorMiddleware } from "./middleware/error.middleware"
import reportsRoutes from "./modules/reports/reports.routes"

const app = express()
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json())

app.use(express.urlencoded({ extended: true }))

//ROUTES
app.use("/api/v1/health", healthRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/accounts", accountRoutes)
app.use("/api/v1/transactions", transactionRoutes)
app.use("/api/v1/analytics", analyticsRoutes)
app.use("/api/v1/reconciliation", reconciliationRoutes)
app.use("/api/v1/reports", reportsRoutes)

//404
app.use(notFoundMiddleware)

//ERROR
app.use(errorMiddleware)

export default app