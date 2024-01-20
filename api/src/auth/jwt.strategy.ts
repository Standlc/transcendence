import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-jwt";
import { UserProfileDto } from "src/users/dto/user-profile.dto";
import { UsersService } from "src/users/users.service";

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService, private jwtService: JwtService) {
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
    // let token: string | null = null;
    if (req && req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      // this.
      // token = this.jwtService.verify(req.cookies.token);
      return req.cookies.token;
    }
    return null;
  }

  /**
   * This function acutally doesnt validate anything as jwt handle the
   * validation of the extracted token.
   * @param payload
   * @returns UserProfileDto
   */
  async validate(payload: any): Promise<UserProfileDto | undefined> {
    return await this.usersService.getUserById(payload.id);
  }
}
