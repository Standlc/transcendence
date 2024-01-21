import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConnectUsersDto } from 'src/users/dto/connect-user.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  /**
   * Validate if the user we receive exist and if the password match.
   * @param username
   * @param password
   * @returns ConnectUsersDto or null
   */
  async validateUser(username: string, password: string): Promise<ConnectUsersDto | undefined> {
    const user = await this.usersService.getUserByName(username);

    if (user) {
      (async () => {
        const result = await bcrypt.compare(password, user.password);
        if (!result)
          return null;
      });
      const rest: ConnectUsersDto = {
        firstname: user.firstname,
        lastname: user.lastname,
        avatarUrl: user.avatarUrl,
        email: user.email,
        id: user.id
      };

      return rest;
    }
    return null;
  }

  /**
   * Create a JWT using a payload and signing it.
   * @param user
   * @returns jwt
   */
  async login(user: any): Promise<string> {
    const payload = {id: user.id};

    return this.jwtService.sign(payload);
  }
}
