// import bcrypt from "bcrypt"
// import crypto from "crypto"
// import jwt from "jsonwebtoken"
// import {prisma} from "../../config/database"
// import {RegisterInput} from "./auth.schema"
// import { env } from "../../config/env"

// export class AuthService{
//     async register(input: RegisterInput){
//         const {name, email, password, organizationName} = input

//         const existingUser = await prisma.user.findUnique({where: {email}})

//         if(existingUser){
//             throw new Error("User with this email already exists.")
//         }

//         const passwordHash = await bcrypt.hash(password, 10)

//         return await prisma.$transaction(async(tx)=>{

//             const role = await tx.role.findUnique({
//                 where:{
//                     name: "ORG_ADMIN"
//                 }
//             })
//             if(!role){
//                 throw new Error("ORG_ADMIN role not found.")
//             }

//             const user = await tx.user.create({
//                 data:{name, email, passwordHash}
//             })

//             const organization = await tx.organization.create({
//                 data:{name: organizationName}
//             })

//             const membership = await tx.membership.create({
//                 data:{
//                     userId : user.id,
//                     organizationId : organization.id,
//                     roleId: role.id
//                 },
//                 include:{
//                     role: true
//                 }
//             })

//             const token = await this.generateTokens(user.id, organization.id, "ORG_ADMIN", tx)
//             return {
//                 user:{id: user.id, email: user.email, name: user.name},
//                 organization: {id: organization.id, name: organization.name},
//                 membership: {role: membership.role},
//                 ...token
//             }
//         })
//     }

//     private async generateTokens(userId: string, organizationId: string, role: string, tx = prisma){
//         const payload = {userId, organizationId, role}
//         const accessToken = jwt.sign(payload,env.JWT_ACCESS_SECRET!, {
//             expiresIn: "15m"
//         })

//         const rawRefreshToken = crypto.randomBytes(40).toString("hex")
//         const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")

//         const expiresAt = new Date()
//         expiresAt.setDate(expiresAt.getDate() + 7)

//         await tx.refreshToken.create({
//             data:{
//                 tokenHash, 
//                 userId,
//                 expiresAt
//             }
//         })

//         return {accessToken, refreshToken: rawRefreshToken}
//     }

//     async refreshToken(rawRefreshToken: string){
//         const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")

//         const storedToken = await prisma.refreshToken.findUnique({
//             where: {tokenHash},
//             include: {
//                 user:{
//                     include:{
//                         memberships: true
//                     }
//                 }
//             }
//         })

//         if(!storedToken){
//             throw new Error("Invalid refresh token.")
//         }

//         if(storedToken.revokedAt){
//             throw new Error("Refresh token has already been revoked.")
//         }

//         if(storedToken.expiresAt < new Date()){
//             throw new Error("Refresh token has expired.")
//         }


//         const primaryMembership = storedToken.user.memberships[0]
//         if(!primaryMembership){
//             throw new Error("User does not belong to an active organization.")
//         }

//         return await prisma.$transaction(async(tx)=>{
//             await tx.refreshToken.update({
//                 where: {id: storedToken.id},
//                 data: {revokedAt: new Date()}
//             })

//             return await this.generateTokens(
//                 storedToken.userId,
//                 primaryMembership.organizationId,
//                 primaryMembership.role,
//                 tx
//             )
//         })
//     }

// }


import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { LoginInput, RegisterInput } from "./auth.schema";
import { env } from "../../config/env";


export class AuthService {
  async register(input: RegisterInput) {
    const {
      name,
      email,
      password,
      organizationName
    } = input;

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find the role from the database
      const role = await tx.role.findUnique({
        where: {
          name: "ORG_ADMIN"
        }
      });

      if (!role) {
        throw new Error("ORG_ADMIN role not found.");
      }

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash
        }
      });

      // Create membership
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: role.id
        },
        include: {
          role: true
        }
      });

      // Generate access token
      const accessToken = this.generateAccessToken(
        user.id,
        organization.id,
        membership.role.name
      );

      // Generate refresh token
      const rawRefreshToken = crypto
        .randomBytes(40)
        .toString("hex");

      const tokenHash = this.hashRefreshToken(
        rawRefreshToken
      );

      const expiresAt = new Date();

      expiresAt.setDate(
        expiresAt.getDate() + 7
      );

      // Store hashed refresh token
      await tx.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt
        }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },

        organization: {
          id: organization.id,
          name: organization.name
        },

        membership: {
          role: membership.role.name
        },

        accessToken,

        refreshToken: rawRefreshToken
      };
    });
  }

  private generateAccessToken(
    userId: string,
    organizationId: string,
    role: string
  ) {
    const payload = {
      userId,
      organizationId,
      role
    };

    return jwt.sign(
      payload,
      env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "15m"
      }
    );
  }

  private generateRefreshToken() {
    return crypto
      .randomBytes(40)
      .toString("hex");
  }

  private hashRefreshToken(token: string) {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

  async refreshToken(rawRefreshToken: string) {
    const tokenHash = this.hashRefreshToken(
      rawRefreshToken
    );

    const storedToken =
      await prisma.refreshToken.findUnique({
        where: {
          tokenHash
        },
        include: {
          user: {
            include: {
              memberships: {
                include: {
                  role: true
                }
              }
            }
          }
        }
      });

    if (!storedToken) {
      throw new Error("Invalid refresh token.");
    }

    if (storedToken.revokedAt) {
      throw new Error(
        "Refresh token has already been revoked."
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error(
        "Refresh token has expired."
      );
    }

    const primaryMembership =
      storedToken.user.memberships[0];

    if (!primaryMembership) {
      throw new Error(
        "User does not belong to an active organization."
      );
    }

    return await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Revoke old refresh token
        await tx.refreshToken.update({
          where: {
            id: storedToken.id
          },
          data: {
            revokedAt: new Date()
          }
        });

        const accessToken =
          this.generateAccessToken(
            storedToken.userId,
            primaryMembership.organizationId,
            primaryMembership.role.name
          );

        const newRawRefreshToken =
          this.generateRefreshToken();

        const newTokenHash =
          this.hashRefreshToken(
            newRawRefreshToken
          );

        const expiresAt = new Date();

        expiresAt.setDate(
          expiresAt.getDate() + 7
        );

        // Store rotated refresh token
        await tx.refreshToken.create({
          data: {
            tokenHash: newTokenHash,
            userId: storedToken.userId,
            expiresAt
          }
        });

        return {
          accessToken,
          refreshToken: newRawRefreshToken
        };
      }
    );
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    const primaryMembership = user.memberships[0];

    if (!primaryMembership) {
      throw new Error(
        "User is not associated with an active organization."
      );
    }

    const accessToken = this.generateAccessToken(
      user.id,
      primaryMembership.organizationId,
      primaryMembership.role.name
    );

    const rawRefreshToken = this.generateRefreshToken();

    const tokenHash = this.hashRefreshToken(
      rawRefreshToken
    );

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      organizationId:
        primaryMembership.organizationId,
      role: primaryMembership.role.name,
      accessToken,
      refreshToken: rawRefreshToken
    };
  }
  async logout(rawRefreshToken: string) {
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")

    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    })
    return { success: true }
  }

  async createUser(organizationId: string, input:{name:string, email: string,password: string, role: string}){
    const {name, email, password, role} = input
    const existingUser = await prisma.user.findUnique({where:{email}})

    if(existingUser){
      throw new Error("User with this email already exists.")
    }

    const roleRecord = await prisma.role.findUnique({
      where:{name: role as any}
    })

    if(!roleRecord){
      throw new Error(`${role} role not found.`)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    return await prisma.$transaction(async(tx)=>{
      const user = await tx.user.create({
        data: {
          name,
          email, 
          passwordHash
        }
      })

      const memberShip = await tx.membership.create({
        data:{
          userId: user.id,
          organizationId,
          roleId: roleRecord.id
        },
        include:{
          role: true
        }
      })

      return {
        user:{
          id: user.id,
          name: user.name,
          email: user.email
        },
        memberShip:{
          organizationId,
          role: memberShip.role.name
        }
      }
    })
  }
}