import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AppUser } from 'src/types/clientSchema';
import { userFromIntra } from './oauth.strategy';

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
  async login(id: number): Promise<string> {
    const payload = {id: id};

    return await this.jwtService.signAsync(payload);
  }
}
