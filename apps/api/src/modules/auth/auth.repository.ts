import prisma from "../../infrastructure/database/prisma.js";

class AuthRepository {
  // find user by id
  async findById(id: bigint) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  // find user by email
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        credentials: true,
        preferences: true,
      },
    });
  }

  // update last login
  async updateLastLogin(userId: bigint) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}

export default AuthRepository;
