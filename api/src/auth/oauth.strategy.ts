import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { AuthService } from "./auth.service";
import { HttpService } from "@nestjs/axios";
import { AxiosError, AxiosResponse } from "axios";
import { catchError, firstValueFrom } from "rxjs";

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, private readonly httpService: HttpService) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: 'u-s4t2ud-bfc3bd01981c3981040a3dad1e9dd27fb360884521e5e00d29a603717305c64a',
      clientSecret: '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',
      callbackURL: 'http://localhost:3000/api/auth/redirect',
      scope: 'public'
    }); //config
  }

  //protect with try catch
  async validate(accessToken: string) {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` }
    };

    let test: AxiosResponse<any>;
    test = await firstValueFrom(
      this.httpService.get<any>('https://api.intra.42.fr/v2/me', config).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response?.data);
          throw "An error happened!";
        }),
      ),
    );
    console.log(test);
    console.log(accessToken);
    return 'test';
  }
}
