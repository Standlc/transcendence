import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-jwt";
import { AppUser } from "src/types/clientSchema";
import { UsersService } from "src/users/users.service";

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor(private usersService: UsersService) {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: Jwt2faStrategy.extractJwtFromCookie,
      ignoreExpiration: false
    })
  }

  /**
   * This is our custom jwt extractor from cookie
   * @param req
   * @returns token or null
  */
  private static extractJwtFromCookie(req: Request): string | undefined {
    if (req && req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
  }

  async validate(payload: {
    id: number,
    isTwoFactorAuthenticated: boolean
  }): Promise<{ id: number } | undefined> {
    try {
      if (!payload.id) {
        console.warn("Someone has a valid token that doesn't contain a user id field");
        throw "Missing information from the payload";
      }
      const user = await this.usersService.getUserById(payload.id);
      return { id: user.id };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }
}
