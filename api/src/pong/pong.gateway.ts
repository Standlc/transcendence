import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DISCONNECTION_END_GAME_TIMEMOUT,
  GAME_ERRORS,
  GameErrorType,
  GameLiveStatsType,
  GameRequestType,
  GameType,
  JoinGameRoomDto,
  PlayerMoveDto,
  PlayerType,
  PrivateGameRequestDto,
  PrivateGameRequestResponseDto,
  PublicGameRequestDto,
} from 'src/types/game';
import { GameEngineService } from './gameLogic/game';
import { GamesService } from 'src/games/games.service';
import { DefaultEventsMap } from '@socket.io/component-emitter';

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
export class PongGateway {
  @WebSocketServer()
  private server: Server<any, any>;
  private games = new Map<number, GameType>();
  private gameRequests: GameRequestType[] = [];

  constructor(
    private readonly gamesService: GamesService,
    private readonly gameEngineService: GameEngineService,
  ) {}

  afterInit(client: Socket) {
    // console.log('Initialized');
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    console.log('connecting:', userId, client.id);
    // console.log(client.handshake.headers.cookie);
    if (isNaN(userId)) {
      client.disconnect(true);
      return;
    }
    client.data.userId = userId;
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    this.deleteUserGameRequest(userId);
    this.handleDisconnectionEvent(client);
  }

  deleteUserGameRequest(userId: number) {
    this.gameRequests = this.gameRequests.filter(
      (req) => req.userId !== userId,
    );
  }

  @SubscribeMessage('leaveGame')
  handleDisconnectionEvent(client: Socket) {
    const userId = this.extractUserId(client);

    // console.log('disconnecting', userId, client.id);

    const userGame = this.findUserGame(userId);
    if (userGame) {
      const { player, otherPlayer } = getPlayer(userGame, 'userId', userId);
      if (!player || !player.isConnected) {
        return;
      }

      player.isConnected = false;
      if (otherPlayer.isConnected) {
        this.handlePlayerDisconnection(player, userGame);
      }
    }
  }

  handlePlayerDisconnection(player: PlayerType, gameState: GameType) {
    let secondsUntilEnd = DISCONNECTION_END_GAME_TIMEMOUT;

    gameState.userIdBeingDisconnected = player.userId;
    clearInterval(gameState.disconnectionIntervalId);
    gameState.disconnectionIntervalId = setInterval(async () => {
      gameState.isPaused = true;

      if (!secondsUntilEnd) {
        this.clearAllDisconnectionTimeouts(gameState);
        await this.updateGameRecordAndEmit(gameState);
        this.games.delete(gameState.game.id);
        return;
      }

      this.server
        .to(gameState.roomId)
        .emit('playerDisconnection', { secondsUntilEnd });
      secondsUntilEnd -= 1;
    }, 1000);
  }

  async updateGameRecordAndEmit(gameState: GameType) {
    const updatedGameRecord = await this.gamesService.finishGame(gameState);
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
    this.server.to(gameState.roomId).emit('gameEnd', updatedGameRecord);
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

    const { player, otherPlayer } = getPlayer(gameState, 'userId', userId);
    if (player) {
      if (player.userId === gameState.userIdBeingDisconnected) {
        gameState.userIdBeingDisconnected = undefined;
        this.clearAllDisconnectionTimeouts(gameState);
      }

      player.isConnected = true;
      gameState.isPaused = !otherPlayer.isConnected;

      // the other player left while this one was disconnected
      if (!otherPlayer.isConnected && !gameState.userIdBeingDisconnected) {
        this.handlePlayerDisconnection(otherPlayer, gameState);
      }
    }

    if (gameState.isPublic || player) {
      client.join(data.roomId.toString());
      this.server.to(client.id).emit('updateGameState', gameState.game);
    } else {
      return {
        errorCode: GAME_ERRORS.USER_NOT_ALLOWED,
      };
    }
  }

  clearAllDisconnectionTimeouts(gameState: GameType) {
    clearInterval(gameState.disconnectionIntervalId);
  }

  @SubscribeMessage('privateGameRequest')
  createPrivateGameRequest(
    client: Socket,
    data: PrivateGameRequestDto,
  ): GameErrorType | undefined {
    const userId = this.extractUserId(client);
    // -> check users are friends
    const userCurrGame = this.findUserGame(userId);
    if (userCurrGame) {
      return {
        errorCode: GAME_ERRORS.USER_ALREADY_IN_GAME,
        currentGameId: userCurrGame.game.id,
      };
    }

    const targetSockets = this.findAllSocketsByUserId(data.targetId);
    const isTargetUserConnected = targetSockets !== undefined;
    if (!isTargetUserConnected) {
      return {
        errorCode: GAME_ERRORS.TARGET_USER_NOT_CONNECTED,
      };
    }

    const targetCurrGame = this.findUserGame(data.targetId);
    if (targetCurrGame) {
      return {
        errorCode: GAME_ERRORS.TARGET_USER_ALREADY_IN_GAME,
      };
    }

    this.addToGameQueue({ userId, ...data });
    this.gameRequests.push();
    this.emitToAll(targetSockets, 'privateGameInvitation', { userId });
  }

  @SubscribeMessage('acceptPrivateGameRequest')
  acceptPrivateGame(client: Socket, data: PrivateGameRequestResponseDto) {
    const userId = this.extractUserId(client);
    const invitation = this.gameRequests.find(
      (req) => req.userId === data.userInvitingId && req.targetId === userId,
    );
    if (!invitation) {
      this.emitError(client, 'This user did not invite you to play.');
      return;
    }

    this.deleteUserGameRequest(data.userInvitingId);
    this.startGame(client, invitation, false);
  }

  async startGame(
    client: Socket,
    invitation: GameRequestType,
    isPublic: boolean,
  ) {
    const gameRecord = await this.gamesService.new({
      player1_id: invitation.userId,
      player2_id: client.data.userId,
      isPublic,
    });

    const gameState: GameType = this.gameEngineService.initialize({
      id: gameRecord.id,
      playerJoinedId: invitation.userId,
      playerJoiningId: client.data.userId,
      isPublic,
      hasPowerUps: invitation.powerUps,
    });

    this.games.set(gameRecord.id, gameState);
    this.runGame(gameState, client, invitation.userId);
  }

  @SubscribeMessage('liveStats')
  returnStats(client: Socket): GameLiveStatsType {
    return {
      usersOnline: this.server.sockets.sockets.size,
      games: this.games.size,
    };
  }

  @SubscribeMessage('cancelRequest')
  cancelGameRequest(client: Socket) {
    const userId = this.extractUserId(client);
    this.deleteUserGameRequest(userId);
  }

  @SubscribeMessage('publicGameRequest')
  handlePublicGameRequest(
    client: Socket,
    data: PublicGameRequestDto,
  ): GameErrorType | undefined {
    const userId = this.extractUserId(client);
    const currUserGame = this.findUserGame(userId);
    if (currUserGame) {
      return {
        errorCode: GAME_ERRORS.USER_ALREADY_IN_GAME,
        currentGameId: currUserGame.game.id,
      };
    }

    this.deleteUserGameRequest(userId);
    const match = this.findGameMatch(data);

    if (match) {
      this.gameRequests = this.gameRequests.filter(
        (req) => req.userId !== match.userId,
      );
      this.startGame(client, match, true);
    } else {
      this.addToGameQueue({ ...data, userId });
    }
  }

  findGameMatch(data: PublicGameRequestDto) {
    const match = this.gameRequests.find((req) => {
      if (req.targetId !== undefined) {
        return;
      }
      if (req.nbPoints === data.nbPoints && req.powerUps === data.powerUps) {
        return req;
      }
    });
    return match;
  }

  runGame(gameState: GameType, client: Socket, playerJoinedId: number) {
    const playerJoinedSocket = this.findSocketByUserId(playerJoinedId);
    if (!playerJoinedSocket) {
      this.server.to(gameState.roomId).emit('error', 'User is not connected');
      return;
    }

    playerJoinedSocket.join(gameState.roomId);
    client.join(gameState.roomId);

    this.server.to(gameState.roomId).emit('gameStart', gameState.game);
    this.gameEngineService.startGameInterval(gameState, async (isGameEnd) => {
      this.server.to(gameState.roomId).emit('updateGameState', gameState.game);
      if (isGameEnd) {
        this.clearAllDisconnectionTimeouts(gameState);
        await this.updateGameRecordAndEmit(gameState);
        this.games.delete(gameState.game.id);
      }
    });
  }

  addToGameQueue(request: GameRequestType) {
    this.gameRequests.push(request);
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

    const { player } = getPlayer(game, 'userId', userId);
    if (!player) {
      // console.log('user is not a player');
      return;
    }

    this.gameEngineService.movePlayerPaddle(player, data.move);
  }

  findUserRequests(userId: number) {
    return this.gameRequests.find((req) => req.userId === userId);
  }

  findUserGame(userId: number) {
    return this.findGame(
      (gameState) =>
        gameState.game.playerLeft.userId === userId ||
        gameState.game.playerRight.userId === userId,
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
    for (const [key, value] of this.server.sockets.sockets) {
      if (value.data.userId === userId) {
        sockets.push(value);
      }
    }
    return sockets.length ? sockets : undefined;
  }

  extractUserId(client: Socket) {
    return Number(client.handshake.query.userId);
  }
}
