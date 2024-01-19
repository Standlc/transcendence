import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.getUserByName(username);

    if (user) {
      (async () => {
        const result = await bcrypt.compare(password, user.password);
        if (!result)
          return null;
      });
      const { password, username, ...rest} = user;

      return rest;
    }
    return null;
  }
}
