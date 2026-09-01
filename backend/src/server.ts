import app from "./app"
import {env} from "./config/env"
import {prisma} from "./config/database"
import { startNotificationWorker } from "./workers/notification.worker"

async function startServer(){
    let worker: Awaited<ReturnType<typeof startNotificationWorker>> | undefined
    try {
        await prisma.$connect()
        console.log("✅ Database connected")

        const server = app.listen(env.PORT, ()=>{
            console.log(
                `FlowForge API running on http://localhost:${env.PORT}`
            )
        })

        worker = await startNotificationWorker()

        process.on("SIGTERM", ()=>shutdown("SIGTERM"))
        process.on("SIGINT", ()=> shutdown("SIGINT"))

        async function shutdown(signal: string) {
            console.log( `\n${signal} received. Shutting down...`)

            server.close(async()=>{
                await worker?.close()
                await prisma.$disconnect()

                console.log("Database disconnected")
                console.log("Server closed")

                process.exit(0)
            })
        }
    } catch (error) {
        console.error("Failed to start server:", error)

        await prisma.$disconnect()
        process.exit(1)
    }
}

startServer()