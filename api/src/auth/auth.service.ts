import { Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AppUser, AppUserDB } from 'src/types/clientSchema';
import { userFromIntra } from './oauth.strategy';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { User } from 'src/types/schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  /**
   * Validate if the user we receive exist and if the password match.
   * @param username
   * @param password
   * @returns AppUser
   */
  async validateUser(username: string, password: string): Promise<AppUser> {
    return await this.usersService.validateUser(username, password);
  }

  /**
   * Validate if the email we receive exist in our db.
   * @param email
   * @returns AppUser -> pass throw if no AppUser was found.
   */
  async validateEmail(email: string): Promise<AppUser> {
    return await this.usersService.getUserByEmail(email);
  }

  /**
   * Wrap userService createOauthUser
   * @param intraUser
   * @returns true or false
   */
  async registerOauth(intraUser: userFromIntra) {
    return await this.usersService.createOauthUser(intraUser);
  }

  /**
   * Create a JWT using a payload and signing it.
   * @param id
   * @returns signed jwt
   */
  async login(userId: number): Promise<{
    jwt: string,
    expires: Date
  }> {
    let date = new Date();
    date.setDate(date.getDate() + 7);
    const payload = {
      id: userId,
      isTwoFactorAuthenticated: false
    };

    return {
      jwt: await this.jwtService.signAsync(payload),
      expires: date
    }
  }

  /**
   * Generate a secret that will be used to validate a set of 6 number.
   * Generate an otpAuthUrl that contain the secret, the username and name of
   * our application, this will be send to the front end later in a form of
   * qrcode.
   * Storing the secret in the user table.
   * @param userId
   * @returns otpAuthUrl
   * @throws InternalServerError
   */
  async generateTwoFactorAuthenticationSecret(userId: number): Promise<string> {
    try {
      const user = await this.usersService.getUserById(userId);
      if (user.isTwoFactorAuthenticationEnabled)
        throw new UnprocessableEntityException("This user already activate 2FA.");
      const secret = authenticator.generateSecret();
      const otpAuthUrl = authenticator.keyuri(user.username, "Transcendence", secret);

      await this.usersService.setTwoFactorAuthenticationSecret(user.id, secret);

      return otpAuthUrl;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Generate a qrcode using qrcode lib.
   * @param otpAuthUrl
   * @returns PNG Image formated as base64 string
   */
  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return await toDataURL(otpAuthUrl);
  }

  /**
   * Verify the code the 2FA app user generate with the code that will be
   * generate from the backend.
   * @param TwoFactorAuthenticationCode
   * @param userId
   * @returns true or false, depending if the code was valid
   */
  async isTwoFactorAuthenticationCodeValid(TwoFactorAuthenticationCode: string, userId: number): Promise<boolean> {
    try {
      return authenticator.verify({
        token: TwoFactorAuthenticationCode,
        secret: await this.usersService.getTwoFactorAuthenticationSecret(userId)
      })
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException)
        throw new UnprocessableEntityException("You tried to validate a 2FA for a user that do not have a secret set !")
      throw error;
    }
  }

  /**
   * Create a JWT using a payload and signing it.
   * @param userId
   * @returns
   */
  async loginWith2fa(userId: number): Promise<{
    jwt: string,
    expires: Date
  }> {
    let date = new Date();
    date.setDate(date.getDate() + 7);
    const payload = {
      id: userId,
      isTwoFactorAuthenticated: true
    }

    return {
      jwt: await this.jwtService.signAsync(payload),
      expires: date
    }
  }
}
