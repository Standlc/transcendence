import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { AuthService } from "./auth.service";

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: 'u-s4t2ud-bfc3bd01981c3981040a3dad1e9dd27fb360884521e5e00d29a603717305c64a',
      clientSecret: 'DO NOT COMMIT',
      callbackURL: 'http://localhost:5000/api/auth/redirect',
      scope: 'public'
    }); //config
  }

  async validate(accessToken: string) {
    console.log(accessToken);
    return 'test';
  }
}
