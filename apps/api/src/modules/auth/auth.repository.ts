import prisma from "../../infrastructure/database/prisma.js";

class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        credentials: true,
      },
    });
  }

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
