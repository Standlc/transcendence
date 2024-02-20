import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

export const jwt = new JwtService();

export const authenticateSocket = (client: Socket, wsGuard: WsAuthGuard) => {
  client.use((client, next) => {
    try {
      const payload: { id: number } = wsGuard.validateToken(client as any);
      (client as any as Socket).data = payload;
      next();
    } catch (error) {
      next(new Error('not authorized'));
    }
  });
};

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient();
    try {
      const payload: { id: number } = this.validateToken(client);
      client.data = payload;
      return true;
    } catch (error) {
      return false;
    }
  }

  validateToken(client: Socket) {
    const token = client.handshake.headers.cookie?.split('=')[1];
    if (!token) {
      throw new Error('Unauthorized');
    }

    const jwtPayload = jwt.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    return jwtPayload;
  }
}
