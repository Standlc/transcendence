import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { jwtStrategy } from './jwt.strategy';
import { Oauth2Strategy } from './oauth.strategy';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.registerAsync({
    useFactory: () => ({
      secret: process.env.JWT_SECRET,
      signOptions: {expiresIn: '7d'}
    })
  }), HttpModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, jwtStrategy, Oauth2Strategy],
  exports: [AuthService],
})
export class AuthModule {}
