import {prisma} from "../../config/database"

export async function getHealth(){
    await prisma.$queryRaw`SELECT 1`

    return {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString()
    }
}