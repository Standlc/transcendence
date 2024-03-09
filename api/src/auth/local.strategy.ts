import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";
import { AppUser } from "src/types/clientSchema";

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
   * @throws UnauthorizedException
   */
  async validate(username: string, password: string): Promise<Partial<AppUser>> {
    let user: AppUser;
    try {
      user = await this.authService.validateUser(username, password);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    return user;
  }
}
