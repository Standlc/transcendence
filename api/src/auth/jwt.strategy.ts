import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-jwt";
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
   * validation of the extracted token.
   * @param payload
   * @returns UserID
   */
  async validate(payload: {id: number}): Promise<{id: number} | undefined> {
    const user = await this.usersService.getUserById(payload.id);
    if (!user)
      return undefined;
    return payload;
  }
}
