import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

export function validateToken(client: Socket) {
  // const { authorization } = client.handshake.auth;
  // const token = authorization.split(' ')[1];
  // const isVerified = verify(token, process.env.JWT_SECRET);
  // return isVerified;
}

@Injectable()
export class PongGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') {
      return false;
    }

    const client: Socket = context.switchToWs().getClient();
    validateToken(client);

    return true;
  }

  // static validateToken(client: Socket) {
  // const { authorization } = client.handshake.auth;
  // const token = authorization.split(' ')[1];
  // const isVerified = verify(token, process.env.JWT_SECRET);
  // return isVerified;
  // }
}
