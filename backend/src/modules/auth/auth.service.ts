import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import {prisma} from "../../config/database"
import {RegisterInput} from "./auth.schema"

export class AuthService{
    async register(input: RegisterInput){
        const {name, email, password, organizationName} = input
    }
}