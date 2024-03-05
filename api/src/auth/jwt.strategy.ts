import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-jwt";
import { AppUser } from "src/types/clientSchema";
import { UsersService } from "src/users/users.service";

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: jwtStrategy.extractJwtFromCookie,
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

  /**
   * This function acutally doesnt validate anything as jwt handle the
   * validation of the extracted token. We just validate if the id exist in our
   * database. Someone could have a valid token that was issue for an account
   * that has been deleted. Token is valid for seven days.
   * Someone who is having a valid token without a user id field should never
   * occurs, it probably means someone succesfully generate a token, they might
   * know the JWT_SECRET we use
   * @param payload
   * @returns UserID
   * @throws UnauthorizedException
   */
  async validate(payload: {
    id: number,
    isTwoFactorAuthenticated: boolean,
    date: number
  }): Promise<{ id: number } | undefined> {
    if (payload.date < Date.now())
      throw new UnauthorizedException('Token expired');
    try {
      if (!payload.id) {
        console.warn("Someone has a valid token that doesn't contain a user id field");
        throw "Missing information from the payload";
      }
      const user = await this.usersService.getUserById(payload.id);
      if (user.isTwoFactorAuthenticationEnabled && !payload.isTwoFactorAuthenticated)
        throw "Missing 2FA from the payload";
      return { id: user.id };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }
}
