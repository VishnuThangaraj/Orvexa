import AppError from "../../common/errors/AppError.js";
import { verifyPassword } from "../../common/utils/password.js";
import AuthRepository from "./auth.repository.js";
import { UserLogin } from "./auth.types.js";

class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  // user login
  async userLogin(data: UserLogin) {
    const user = await this.authRepository.findByEmail(data.email);

    if (!user) {
      throw new AppError("Invalid Credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive — login disabled", 403);
    }

    if (!user.credentials?.passwordHash) {
      throw new AppError("Invalid Credentials", 401);
    }

    const validPassword = await verifyPassword(
      user.credentials.passwordHash,
      data.password,
    );

    if (!validPassword) {
      throw new AppError("Invalid Credentials", 401);
    }

    const previousLoginAt = user.lastLoginAt;

    await this.authRepository.updateLastLogin(user.id);

    const { credentials, ...safeUser } = user;
    safeUser.lastLoginAt = previousLoginAt;
    return safeUser;
  }
}

export default AuthService;
