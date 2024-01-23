import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DISCONNECTION_END_GAME_TIMEMOUT,
  EmitPayloadType,
  GAME_ERRORS,
  GameErrorType,
  GameRequestDto,
  GameStateType,
  GameType,
  JoinGameRoomDto,
  LeaveGameDto,
  LiveGameType,
  PlayerMoveDto,
  PlayerType,
} from 'src/types/game';
import { GameEngineService } from './gameLogic/game';
import { GamesService } from 'src/games/games.service';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { v4 as uid } from 'uuid';
import { GameRequestsService } from 'src/gameRequests/GameRequests.service';
import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { AppGameRequest } from 'src/types/games/gameRequests';

const getPlayer = (
  gameState: GameType,
  field: keyof PlayerType,
  value: any,
) => {
  if (gameState.game.playerLeft[field] === value) {
    return {
      player: gameState.game.playerLeft,
      otherPlayer: gameState.game.playerRight,
    };
  } else if (gameState.game.playerRight[field] === value) {
    return {
      player: gameState.game.playerRight,
      otherPlayer: gameState.game.playerLeft,
    };
  }
  return {
    player: undefined,
    otherPlayer: undefined,
  };
};

@WebSocketGateway(5050, {
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class PongGateway {
  @WebSocketServer()
  private server: Server<any, any>;
  private games = new Map<string, GameType>();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    @Inject(forwardRef(() => GameRequestsService))
    private readonly gameRequestsService: GameRequestsService,
    private readonly gameEngineService: GameEngineService,
    private readonly wsGuard: WsAuthGuard,
  ) {}

  afterInit(client: Socket) {
    client.use((client, next) => {
      try {
        const payload: { id: number } = this.wsGuard.validateToken(
          client as any,
        );
        (client as any as Socket).data = payload;
        next();
      } catch (error) {
        next(new Error('not authorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(this.server.sockets.sockets.size);
    this.server.sockets.sockets.forEach((socket) => {
      console.log('socket', socket.id, 'with userId', socket.data.id);
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    this.gameRequestsService.delete(userId);
  }

  @SubscribeMessage('leaveGame')
  handleDisconnectionEvent(client: Socket, data: LeaveGameDto) {
    const userId = this.extractUserId(client);

    console.log('disconnecting', userId, client.id);

    const game = this.findGame((g) => g.game.id === data.gameId);
    if (game) {
      const { player, otherPlayer } = getPlayer(game, 'id', userId);
      if (!player || !player.isConnected) {
        // game.viewers -= 1;
        return;
      }

      console.log('DISCONNECTING', userId);
      player.isConnected = false;
      if (otherPlayer.isConnected) {
        this.handlePlayerDisconnection(player, game);
      }
    }
  }

  handlePlayerDisconnection(player: PlayerType, gameState: GameType) {
    let secondsUntilEnd = DISCONNECTION_END_GAME_TIMEMOUT;

    gameState.userIdBeingDisconnected = player.id;
    clearInterval(gameState.disconnectionIntervalId);
    gameState.disconnectionIntervalId = setInterval(async () => {
      gameState.isPaused = true;

      if (!secondsUntilEnd) {
        await this.handleGameEnd(gameState);
        return;
      }

      const payload = {
        secondsUntilEnd,
        userId: player.id,
      };
      this.sendTo(gameState.game.id, 'playerDisconnection', payload);
      secondsUntilEnd -= 1;
    }, 1000);
  }

  async updateGameRecordAndEmit(gameState: GameType) {
    const updatedGameRecord = await this.gamesService.finishGame(gameState);
    if (!updatedGameRecord) {
      return;
    }
    // const playerLeft = gameState.game.playerLeft;
    // const playerRight = gameState.game.playerRight;
    // const totalScore = playerLeft.score + playerRight.score;
    // await db
    //   .updateTable('user')
    //   .set({
    //     rating: sql`rating + 32 * (${playerLeft.score / totalScore} -  )`,
    //   })
    //   .where('user.id', '=', playerLeft.userId)
    //   .execute();
    this.sendTo(gameState.game.id, 'gameEnd', updatedGameRecord);
  }

  @SubscribeMessage('joinRoom')
  joinGameRoom(
    client: Socket,
    data: JoinGameRoomDto,
  ): GameErrorType | undefined {
    const userId = this.extractUserId(client);
    const gameState = this.games.get(data.roomId);
    if (!gameState) {
      return {
        errorCode: GAME_ERRORS.NO_SUCH_GAME,
      };
    }

    const { player, otherPlayer } = getPlayer(gameState, 'id', userId);
    if (player) {
      if (player.id === gameState.userIdBeingDisconnected) {
        gameState.userIdBeingDisconnected = undefined;
        this.clearAllGameIntervals(gameState);
      }

      player.isConnected = true;
      gameState.isPaused = !otherPlayer.isConnected;

      // the other player left while this one was disconnected
      if (!otherPlayer.isConnected && !gameState.userIdBeingDisconnected) {
        this.handlePlayerDisconnection(otherPlayer, gameState);
      }
    }

    if (gameState.isPublic || player) {
      // if (!player) {
      //   gameState.viewers += 1;
      // }
      client.join(data.roomId);
      this.sendTo(client.id, 'updateGameState', gameState.game);
      // this.sendTo(client.id, 'viewersCount', gameState.viewers);
    } else {
      return {
        errorCode: GAME_ERRORS.USER_NOT_ALLOWED,
      };
    }
  }

  clearAllGameIntervals(gameState: GameType) {
    clearInterval(gameState.disconnectionIntervalId);
    clearInterval(gameState.liveStatsIntervalId);
  }

  sendPrivateGameInvite(invite: AppGameRequest) {
    if (!invite.targetId) return;
    const userSockets = this.findAllSocketsByUserId(invite.targetId);
    if (!userSockets) {
      // -> handle no target sockets
      return;
    }
    for (const socket of userSockets) {
      this.sendTo(socket.id, 'privateGameInvitation', invite);
    }
  }

  async startGame(gameReq: GameRequestDto, userIds: number[]) {
    const gameId = uid();
    const gameState = this.gameEngineService.initialize({
      id: gameId,
      playerLeftId: userIds[0],
      playerRightId: userIds[1],
      gameReq,
    });
    this.games.set(gameId, gameState);
    this.joinUsersToGameRoom(gameId, userIds);
    this.runGame(gameState);
  }

  joinUsersToGameRoom(roomId: string, userIds: number[]) {
    userIds.forEach((userId) => {
      const userSockets = this.findAllSocketsByUserId(userId);
      if (!userSockets) return;
      userSockets.forEach((socket) => {
        this.sendTo(socket.id, 'gameStart', roomId);
        socket.join(roomId);
      });
    });
  }

  // @SubscribeMessage('liveGames')
  // returnStats(client: Socket): LiveGamesDto {
  //   return {
  //     games: this.getAllPublicGames(),
  //   };
  // }

  cancelGameRequest(client: Socket) {
    const userId = this.extractUserId(client);
    this.gameRequestsService.delete(userId);
  }

  runGame(gameState: GameType) {
    this.sendAllOngoingGames();
    this.gameEngineService.startGameInterval(gameState, async (isGameEnd) => {
      this.sendTo(gameState.game.id, 'updateGameState', gameState.game);
      if (isGameEnd) {
        await this.handleGameEnd(gameState);
      }
    });
  }

  sendAllOngoingGames() {
    const liveGames: GameStateType[] = [];
    this.games.forEach((game) => {
      liveGames.push(game.game);
    });
    this.sendToAll('liveGames', {
      games: liveGames,
    });
  }

  getAllPublicGames() {
    const liveGames: LiveGameType[] = [];
    this.games.forEach((game) => {
      if (game.isPublic) {
        liveGames.push({
          id: game.game.id,
          players: [
            {
              id: game.game.playerLeft.id,
              score: game.game.playerLeft.score,
            },
            {
              id: game.game.playerRight.id,
              score: game.game.playerRight.score,
            },
          ],
        });
      }
    });
    return liveGames;
  }

  async handleGameEnd(game: GameType) {
    this.clearAllGameIntervals(game);
    await this.updateGameRecordAndEmit(game);
    this.games.delete(game.game.id);
  }

  getSocketClient(socketId: string) {
    return this.server.sockets.sockets.get(socketId);
  }

  /**
   * CONTROLS
   */
  @SubscribeMessage('playerMove')
  handleMoveUp(client: Socket, data: PlayerMoveDto) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (!game || game.isPaused) {
      // console.log('move error: no such game');
      return;
    }

    const { player } = getPlayer(game, 'id', userId);
    if (!player) {
      // console.log('user is not a player');
      return;
    }

    this.gameEngineService.movePlayerPaddle(player, data.move);
  }

  findUserGame(userId: number) {
    return this.findGame(
      (gameState) =>
        gameState.game.playerLeft.id === userId ||
        gameState.game.playerRight.id === userId,
    );
  }

  findGame(callBack: (gameState: GameType) => boolean) {
    for (const [key, value] of this.games) {
      if (callBack(value)) {
        return value;
      }
    }
    return null;
  }

  emitToAll(
    clients: Socket<any, any, DefaultEventsMap, any>[],
    ev: string,
    data: any,
  ) {
    clients.forEach((client) => {
      this.server.to(client.id).emit(ev, data);
    });
  }

  emitError(client: Socket, message: string) {
    this.server.to(client.id).emit('error', message);
  }

  findSocket(
    callBack: (
      clientId: string,
      client: Socket<any, any, DefaultEventsMap, any>,
    ) => boolean,
  ) {
    for (const [key, value] of this.server.sockets.sockets) {
      if (callBack(key, value)) {
        return value;
      }
    }
    return null;
  }

  findSocketByUserId(userId: number) {
    return this.findSocket((_, client) => client.data.userId === userId);
  }

  findAllSocketsByUserId(userId: number) {
    const sockets: Socket<any, any, DefaultEventsMap, any>[] = [];
    for (const [_, value] of this.server.sockets.sockets) {
      if (value.data.id === userId) {
        sockets.push(value);
      }
    }
    return sockets.length ? sockets : undefined;
  }

  sendTo<T extends string>(roomId: string, ev: T, payload: EmitPayloadType<T>) {
    this.server.to(roomId).emit(ev, payload);
  }

  sendToAll<T extends string>(ev: T, payload: EmitPayloadType<T>) {
    this.server.emit(ev as string, payload);
  }

  extractUserId(client: Socket) {
    return client.data.id;
  }
}
