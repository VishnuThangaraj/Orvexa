import AppError from "../../common/errors/AppError.js";
import {
  generateAuthToken,
  verifyRefreshToken,
  type JwtPayload,
} from "../../common/utils/jwt.js";
import { Role } from "../../common/types/roles.js";
import { verifyPassword } from "../../common/utils/password.js";
import AuthRepository from "./auth.repository.js";
import { RefreshTokenInput, UserLogin } from "./auth.types.js";

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

    const tokens = generateAuthToken({
      id: user.id.toString(),
      role: user.role as Role,
    });

    const { credentials, ...safeUser } = user;
    safeUser.lastLoginAt = previousLoginAt;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  // refresh token
  async refreshToken(data: RefreshTokenInput) {
    let payload: JwtPayload;

    try {
      payload = verifyRefreshToken(data.refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const userId =
      typeof payload.id === "bigint" ? payload.id : BigInt(payload.id);
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new AppError("User account not found", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive — login disabled", 403);
    }

    // Generate a fresh pair of tokens
    const tokens = generateAuthToken({
      id: user.id.toString(),
      role: user.role as Role,
    });

    return tokens;
  }

  // user profile
  async userProfile(id: bigint) {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new AppError("User profile not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    return user;
  }
}

export default AuthService;
