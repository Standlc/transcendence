import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { AppUser } from 'src/types/clientSchema';
import { userFromIntra } from './oauth.strategy';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  /**
   * Validate if the user we receive exist and if the password match.
   * @param loginUserDto
   * @returns AppUser or null
   */
  async validateUser(loginUserDto: LoginUserDto): Promise<AppUser> {
    return await this.usersService.validateUser(loginUserDto);
  }

  async validateEmail(email: string): Promise<AppUser> {
    return await this.usersService.getUserByEmail(email);
  }

  async registerOauth(intraUser: userFromIntra): Promise<boolean> {
    return await this.usersService.createOauthUser(intraUser);
  }

  /**
   * Create a JWT using a payload and signing it.
   * @param id
   * @returns signed jwt
   */
  async login(id: number): Promise<string> {
    const payload = {id: id};

    return this.jwtService.sign(payload);
  }
}
