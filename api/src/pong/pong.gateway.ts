import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from 'src/games/games.service';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { GameRequestsService } from 'src/gameRequests/GameRequests.service';
import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { PlayersService } from './players/players.service';
import { Game, PublicGameRequest } from 'src/types/schema';
import { Selectable } from 'kysely';
import {
  DISCONNECTION_END_GAME_TIMEMOUT,
  initialize,
  movePlayerPaddle,
  startGameInterval,
} from './gameLogic/game';
import {
  GameStateType,
  GameType,
  PlayerType,
} from 'src/types/games/pongGameTypes';
import {
  EmitPayloadType,
  Tuple,
  WsError,
  WsGameIdType,
  WsPlayerMove,
} from 'src/types/games/socketPayloadTypes';
import { getOtherPlayer, getWinnerId } from './gameLogic/utils';

const getPlayer = (
  game: GameStateType,
  field: keyof PlayerType,
  value: any,
) => {
  if (game.playerOne[field] === value) {
    return {
      player: game.playerOne,
      otherPlayer: game.playerTwo,
    };
  } else if (game.playerTwo[field] === value) {
    return {
      player: game.playerTwo,
      otherPlayer: game.playerOne,
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
  private games = new Map<number, GameType>();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    @Inject(forwardRef(() => GameRequestsService))
    private readonly gameRequestsService: GameRequestsService,
    private readonly wsGuard: WsAuthGuard,
    private readonly players: PlayersService,
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
    // console.log(this.server.sockets);
    // console.log('NEW CONNECTION:', client.id, 'with userId', client.data.id);
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    // console.log('DISCONNECTION:', client.id, 'with userId', client.data.id);
    this.gameRequestsService.delete(userId);
  }

  @SubscribeMessage('leaveGame')
  handleDisconnectionEvent(client: Socket, data: WsGameIdType) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (game) {
      const { player, otherPlayer } = getPlayer(game.game, 'id', userId);
      if (!player || !player.isConnected) {
        return;
      }
      player.isConnected = false;
      if (otherPlayer.isConnected) {
        this.handlePlayerDisconnection(player, game);
      }
    }
  }

  @SubscribeMessage('cancelGameRequest')
  cancelGameRequest(client: Socket) {
    const userId = this.extractUserId(client);
    this.gameRequestsService.delete(userId);
  }

  handlePlayerDisconnection(player: PlayerType, gameState: GameType) {
    let secondsUntilEnd = DISCONNECTION_END_GAME_TIMEMOUT;

    gameState.userIdBeingDisconnected = player.id;
    clearInterval(gameState.disconnectionIntervalId);
    gameState.disconnectionIntervalId = setInterval(async () => {
      gameState.isPaused = true;

      if (!secondsUntilEnd) {
        try {
          const connectedPlayer = getOtherPlayer(gameState.game, player.id);
          await this.updatePlayerScore(
            gameState,
            connectedPlayer,
            gameState.points,
          );
          await this.handleGameEnd(gameState);
        } catch (error) {
          console.log(error);
          // -> return error
        }
        return;
      }
      const payload = {
        secondsUntilEnd,
        userId: player.id,
      };
      this.sendTo(gameState.roomId, 'playerDisconnection', payload);
      secondsUntilEnd -= 1;
    }, 1000);
  }

  @SubscribeMessage('joinRoom')
  joinGameRoom(client: Socket, data: WsGameIdType) {
    const userId = this.extractUserId(client);
    const gameState = this.games.get(data.gameId);
    if (!gameState) return;

    const { player, otherPlayer } = getPlayer(gameState.game, 'id', userId);
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
      client.join(data.gameId.toString());
      this.sendTo(client.id, 'updateGameState', gameState.game);
      this.sendTo(gameState.roomId, 'pause', { isPaused: gameState.isPaused });
    }
  }

  clearAllGameIntervals(gameState: GameType) {
    clearInterval(gameState.disconnectionIntervalId);
  }

  sendPrivateGameInvite(invite: Selectable<PublicGameRequest>) {
    if (!invite.targetId) return;
    const userSockets = this.findAllSocketsByUserId(invite.targetId);
    if (!userSockets) {
      // -> handle no target sockets
      return;
    }
    userSockets.forEach((socket) => {
      this.sendTo(socket.id, 'privateGameInvitation', invite);
    });
  }

  async startGame(gameRecord: Selectable<Game>) {
    const gameState = initialize(gameRecord);
    this.games.set(gameState.gameId, gameState);
    this.joinUsersToGameRoom(gameState.roomId, [
      gameRecord.playerOneId,
      gameRecord.playerTwoId,
    ]);

    try {
      await this.runGame(gameState);
    } catch (error) {
      console.log(error);
      // -> return error
    }
  }

  joinUsersToGameRoom(roomId: string, userIds: Tuple<number>) {
    userIds.forEach((userId) => {
      const userSockets = this.findAllSocketsByUserId(userId);
      console.log('userSockets count:', userSockets?.length, 'userId:', userId);
      if (!userSockets) {
        this.emitError(userId === userIds[0] ? userIds[1] : userIds[0], {
          message: `User with userId: ${userId} is not connected.`,
        });
        return;
      }
      userSockets.forEach((socket) => {
        this.sendTo(socket.id, 'gameStart', roomId);
        socket.join(roomId);
      });
    });
  }

  async runGame(gameState: GameType) {
    this.emitNewLiveGame(gameState);
    this.sendTo(gameState.roomId, 'updateGameState', gameState.game);
    await this.sendGameStartCountdown(gameState);

    const handleGameEnd = async (isGameEnd: boolean) => {
      this.sendTo(gameState.roomId, 'updateGameState', gameState.game);
      if (isGameEnd) {
        await this.handleGameEnd(gameState);
      }
    };

    const handleScore = async (player: PlayerType) => {
      await this.updatePlayerScore(gameState, player, player.score + 1);
      this.sendLiveGameUpdate(gameState);
    };

    await startGameInterval(gameState, handleGameEnd, handleScore);
  }

  async sendGameStartCountdown(game: GameType): Promise<void> {
    await new Promise((resolve) => {
      let countdown = 3;
      const intervalId = setInterval(() => {
        if (countdown === 0) {
          this.sendTo(game.roomId, 'startCountdown', countdown);
          clearInterval(intervalId);
          resolve(undefined);
          return;
        }
        this.sendTo(game.roomId, 'startCountdown', countdown);
        countdown--;
      }, 1000);
    });
  }

  sendLiveGameUpdate(game: GameType) {
    const { playerOne, playerTwo } = game.game;
    this.sendToAll('liveGameUpdate', {
      gameId: game.gameId,
      players: [
        {
          id: playerOne.id,
          score: playerOne.score,
        },
        {
          id: playerTwo.id,
          score: playerTwo.score,
        },
      ],
    });
  }

  async handleGameEnd(game: GameType) {
    this.clearAllGameIntervals(game);
    clearInterval(game.intervalId);

    const winnerId = getWinnerId(game);
    const { playerOne, playerTwo } = game.game;
    const newRatings = await this.players.updatePlayersRating([
      playerOne,
      playerTwo,
    ]);
    await this.gamesService.finishGame(game.gameId, winnerId);
    this.sendLiveGameEnd(game, newRatings, winnerId);
    this.sendLeaderboardUpdates(game, newRatings, winnerId);
    this.games.delete(game.gameId);
  }

  @SubscribeMessage('playerMove')
  handlePlayerMove(client: Socket, data: WsPlayerMove) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (!game || game.isPaused) return;

    const { player } = getPlayer(game.game, 'id', userId);
    if (!player) return;

    movePlayerPaddle(player, data.move);
  }

  sendLiveGameEnd(
    game: GameType,
    newRatings: Tuple<{
      rating: number;
      id: number;
    }>,
    winnerId: number,
  ) {
    const { playerOne, playerTwo } = game.game;

    this.sendTo(game.roomId, 'gameEnd', {
      winnerId,
      playerOne: {
        score: playerOne.score,
        rating: newRatings[0].rating,
      },
      playerTwo: {
        score: playerTwo.score,
        rating: newRatings[1].rating,
      },
    });
    this.sendToAll('liveGameEnd', game.gameId);
  }

  sendLeaderboardUpdates(
    game: GameType,
    newRatings: Tuple<{
      rating: number;
      id: number;
    }>,
    winnerId: number,
  ) {
    const { playerOne, playerTwo } = game.game;

    this.sendToAll('leaderboardUpdate', [
      {
        userId: playerOne.id,
        rating: newRatings[0].rating,
        isWinner: winnerId === playerOne.id,
      },
      {
        userId: playerTwo.id,
        rating: newRatings[1].rating,
        isWinner: winnerId === playerTwo.id,
      },
    ]);
  }

  async updatePlayerScore(game: GameType, player: PlayerType, score: number) {
    player.score = score;
    const whichPlayer =
      player.id === game.game.playerOne.id ? 'playerOne' : 'playerTwo';
    await this.gamesService.updatePlayerScore(game.gameId, whichPlayer, score);
  }

  findGame(callBack: (gameState: GameType) => boolean) {
    for (const [key, value] of this.games) {
      if (callBack(value)) {
        return value;
      }
    }
    return null;
  }

  emitNewLiveGame(game: GameType) {
    const payload: WsGameIdType = { gameId: game.gameId };
    this.sendToAll('liveGame', payload);
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

  emitError(userId: number, error: WsError) {
    const sockets = this.findAllSocketsByUserId(userId);
    if (!sockets) return;

    sockets.forEach((socket) => {
      this.sendTo(socket.id, 'error', error);
    });
  }

  findAllSocketsByUserId(userId: number) {
    const sockets: Socket<any, any, DefaultEventsMap, any>[] = [];
    if (!this.server.sockets.sockets) return undefined;
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
