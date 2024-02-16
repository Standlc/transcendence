import { Injectable, InternalServerErrorException, NotAcceptableException, UnauthorizedException, UnprocessableEntityException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { AuthService } from "./auth.service";
import { HttpService } from "@nestjs/axios";
import { AxiosError, AxiosResponse } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import { AppUser } from "src/types/clientSchema";

export interface userFromIntra {
  email: string,
  username: string,
  avatarUrl: string,
  firstname: string,
  lastname: string
}

interface intraUserResponse {
  id: number,
  email: string,
  login: string,
  first_name: string,
  last_name: string,
  usual_full_name: string,
  usual_first_name: string,
  url: string,
  phone: boolean,
  displayname: string,
  kind: string,
  image: {
    link: string
    versions: {
      large: string
      medium: string
      small: string
      micro: string
    }
  },
  staff?: boolean,
  correction_point: number,
  pool_month: string,
  pool_year: boolean,
  location: string | null,
  wallet: number,
  anonymize_date: Date,
  data_erasure_date: Date | null,
  alumni?: boolean,
  active?: boolean,
  groups: [],
  cursus_users: [
    {
      id: number,
      begin_at: Date,
      end_at: string | null,
      grade: string | null,
      level: number,
      skills: [],
      cursus_id: number,
      has_coalition: boolean,
      user: {
        id: number,
        login: string,
        url: string
      },
      cursus: {
        id: number,
        created_at: Date,
        name: string,
        slug: string
      }
    }
  ],
  projects_users: [],
  languages_users: [
    {
      id: number,
      language_id: number,
      user_id: number,
      position: number,
      created_at: Date
    }
  ],
  achievements: [],
  titles: [],
  titles_users: [],
  partnerships: [],
  patroned: [
    {
      id: number,
      user_id: number,
      godfather_id: number,
      ongoing: boolean,
      created_at: Date,
      updated_at: Date
    }
  ],
  patroning: [],
  expertises_users: [
    {
      id: number,
      expertise_id: number,
      interested: boolean,
      value: number,
      contact_me: boolean,
      created_at: Date,
      user_id: number
    }
  ],
  roles: [],
  campus: [
    {
      id: number,
      name: string,
      time_zone: string,
      language: {
        id: number,
        name: string,
        identifier: string,
        created_at: Date,
        updated_at: Date
      },
      users_count: number,
      vogsphere_id: number
    }
  ],
  campus_users: [
    {
      id: number,
      user_id: number,
      campus_id: number,
      is_primary: boolean
    }
  ]
}

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

  async validate(accessToken: string): Promise<AppUser | undefined> {
    // ? Add the token in authorization headers
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` }
    };

    // ? Retrieve the user information with the api of 42 intranet.
    let intraUser: userFromIntra;
    try {
      const allIntraUserInfo: AxiosResponse<intraUserResponse> = await firstValueFrom(
        this.httpService.get<intraUserResponse>(
          'https://api.intra.42.fr/v2/me',
          config
        ).pipe(
          catchError((error: AxiosError) => {
            throw error; // ? throw if anything fail 
          }),
        )
      );
      intraUser = {
        email: allIntraUserInfo.data.email,
        username: allIntraUserInfo.data.login,
        avatarUrl: allIntraUserInfo.data.image.link,
        firstname: allIntraUserInfo.data.first_name,
        lastname: allIntraUserInfo.data.last_name
      }
    } catch (error) {
      // ? Even if the user is legitime, the api fail, we can't authorize them.
      throw new UnauthorizedException();
    }

    // ? Check if the user is already registered in our database.
    let user: AppUser | undefined = undefined;
    try {
      user = await this.authService.validateEmail(intraUser.email);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        console.log(error);
        throw error;
      }
    }
    if (!user) {
      // ? Create a user in our database
      try {
        const result: boolean = await this.authService.registerOauth(intraUser);
        if (!result)
          throw "Fail to create a user";
      } catch (error) {
        console.log(error);
        throw new UnauthorizedException();
      }
      user = await this.authService.validateEmail(intraUser.email);
    }
    return user;
  }
}
