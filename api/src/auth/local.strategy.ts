import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";
import { ConnectUsersDto } from "src/users/dto/connect-user.dto";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();  // config
  }

  /**
   * Wrapper of validateUser in authService for local strategy
   * @param username
   * @param password
   * @returns subset of user data
   */
  async validate(username: string, password: string): Promise<ConnectUsersDto> {
    const user = await this.authService.validateUser(username, password);

    if (!user)
      throw new UnauthorizedException();

    return user;
  }
}
