import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConnectUsersDto } from 'src/users/dto/connect-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { AppUser } from 'src/types/clientSchema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  /**
   * Validate if the user we receive exist and if the password match.
   * @param loginUserDto
   * @returns ConnectUsersDto or null
   */
  async validateUser(loginUserDto: LoginUserDto): Promise<AppUser | undefined> {
    const user = await this.usersService.getUserByName(loginUserDto.username);

    if (user) {
      const result = await bcrypt.compare(loginUserDto.password, user.password);
      if (!result) {
        return;
      }

      const {password, ...appUser} = user;
      return appUser;
    }
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
