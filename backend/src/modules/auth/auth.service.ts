import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import {prisma} from "../../config/database"
import {RegisterInput} from "./auth.schema"

export class AuthService{
    async register(input: RegisterInput){
        const {name, email, password, organizationName} = input

        const existingUser = await prisma.user.findUnique({where: {email}})

        if(existingUser){
            throw new Error("User with this email already exists.")
        }

        const passwordHash = await bcrypt.hash(password, 10)

        return await prisma.$transaction(async(tx)=>{
            const user = await tx.user.create({
                data:{name, email, passwordHash}
            })

            const organization = await tx.organization.create({
                data:{name: organizationName}
            })

            const membership = await tx.membership.create({
                data:{
                    userId : user.id,
                    organizationId : organization.id,
                    role: "ORG_ADMIN",
                }
            })

            const token = await this.generateTokens(user.id, organization.id, "ORG_ADMIN", tx)
            return {
                user:{id: user.id, email: user.email, name: user.name},
                organization: {id: organization.id, name: organization.name},
                membership: {role: membership.role},
                ...token
            }
        })
    }

    private async generateTokens(userId: string, organizationId: string, role: string, tx = prisma){
        const payload = {userId, organizationId, role}
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
            expiresIn: "15m"
        })

        const rawRefreshToken = crypto.randomBytes(40).toString("hex")
        const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await tx.refreshToken.create({
            data:{
                tokenHash, 
                userId,
                expiresAt
            }
        })

        return {accessToken, refreshToken: rawRefreshToken}
    }

}