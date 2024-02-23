import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from 'src/games/games.service';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Inject, UseGuards, forwardRef } from '@nestjs/common';
import { WsAuthGuard, authenticateSocket } from 'src/auth/ws-auth.guard';
import {
  PlayersRatingChangesType,
  PlayersService,
} from './players/players.service';
import { Game, PublicGameRequest } from 'src/types/schema';
import { Selectable } from 'kysely';
import { initialize, startGameInterval } from './gameLogic/game';
import {
  GameStateType,
  GameType,
  PlayerType,
} from 'src/types/games/pongGameTypes';
import {
  EmitPayloadType,
  WsGameIdType,
  WsPlayerMove,
} from 'src/types/games/socketPayloadTypes';
import { getOtherPlayer, getWinner } from './gameLogic/utils';
import {
  DISCONNECTION_END_GAME_TIMEMOUT,
  PLAYER_PING_INTERVAL,
} from './gameLogic/constants';
import { handlePlayerMove } from './gameLogic/paddle';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { AchievementsService } from 'src/achievements/Achievements.service';
import { UserAchievement } from 'src/types/achievements';

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
    private readonly wsGuard: WsAuthGuard,
    private readonly players: PlayersService,
    private readonly usersStatusGateway: UsersStatusGateway,
    private readonly achievementsService: AchievementsService,
  ) {}

  afterInit(client: Socket) {
    authenticateSocket(client, this.wsGuard);
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    client.join(userId.toString());
    // console.log('NEW CONNECTION:', client.id, 'with userId', client.data.id);
  }

  async handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    client.leave(userId.toString());
    // console.log('DISCONNECTION:', client.id, 'with userId', client.data.id);
  }

  @SubscribeMessage('leaveGame')
  handleDisconnectionEvent(client: Socket, data: WsGameIdType) {
    client.leave(data.gameId.toString());
  }

  @SubscribeMessage('joinRoom')
  joinGameRoom(client: Socket, data: WsGameIdType) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (!game) return;

    const { player } = getPlayer(game.game, 'id', userId);
    if (player) {
      this.reconnectPlayerToGame(game, player, Date.now());
      this.usersStatusGateway.setUserAsPlaying(userId);
    }

    if (game.isPublic || player) {
      client.join(data.gameId.toString());
    }
  }

  reconnectPlayerToGame(game: GameType, player: PlayerType, now: number) {
    if (game.userDisconnectedId === player.id) {
      clearInterval(game.disconnectionIntervalId);
      game.userDisconnectedId = undefined;
      game.isPaused = false;
    }
    player.lastPingTime = now;
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: WsGameIdType) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (!game) return;
    const { player } = getPlayer(game.game, 'id', userId);
    if (!player) return;

    const pingTime = Date.now();
    this.reconnectPlayerToGame(game, player, pingTime);
    this.server
      .timeout(100)
      .to(client.id)
      .emit('pong', () => {
        const delay = Date.now() - pingTime;
        player.pingRtt = delay;
      });
  }

  sendPrivateGameInvite(invite: Selectable<PublicGameRequest>) {
    if (!invite.targetId) return;
    this.sendTo(invite.targetId.toString(), 'privateGameInvitation', invite);
  }

  async startGame(gameRecord: Selectable<Game>) {
    const gameState = initialize(gameRecord);
    this.games.set(gameState.gameId, gameState);
    this.joinUsersToGameRoom(gameRecord);
    this.usersStatusGateway.setUserAsPlaying(gameRecord.playerOneId);
    this.usersStatusGateway.setUserAsPlaying(gameRecord.playerTwoId);
    this.runGame(gameState);
  }

  joinUsersToGameRoom(gameRecord: Selectable<Game>) {
    this.server
      .in(gameRecord.playerOneId.toString())
      .socketsJoin(gameRecord.id.toString());
    this.server
      .in(gameRecord.playerTwoId.toString())
      .socketsJoin(gameRecord.id.toString());
  }

  async runGame(gameState: GameType) {
    this.emitNewLiveGame(gameState);
    this.sendTo(gameState.roomId, 'gameStart', gameState.roomId);
    await this.sendGameStartCountdown(gameState);
    gameState.isPaused = false;

    const handleEmitGameState = () => {
      this.sendTo(gameState.roomId, 'updateGameState', gameState.game);
    };

    const handleGameEnd = async () => {
      try {
        await this.handleGameEnd(gameState);
      } catch (error) {
        this.sendTo(gameState.roomId, 'error', {
          message: 'Error while setting game as finished.',
        });
      }
    };

    const handlePlayerScore = async (player: PlayerType) => {
      try {
        await this.updatePlayerScore(gameState, player, player.score + 1);
      } catch (error) {
        this.sendTo(gameState.roomId, 'error', {
          message: 'Error while setting game as finished.',
        });
      }
      this.sendLiveGameUpdate(gameState);
    };

    const handlePlayersConnectivity = (now: number) => {
      const { playerOne, playerTwo } = gameState.game;
      if (now - playerOne.lastPingTime >= PLAYER_PING_INTERVAL + 500) {
        this.handlePlayerDisconnection(playerOne, gameState);
      } else if (now - playerTwo.lastPingTime >= PLAYER_PING_INTERVAL + 500) {
        this.handlePlayerDisconnection(playerTwo, gameState);
      }
    };

    startGameInterval(
      gameState,
      handleEmitGameState,
      handlePlayerScore,
      handlePlayersConnectivity,
      handleGameEnd,
    );
  }

  handlePlayerDisconnection(player: PlayerType, gameState: GameType) {
    clearInterval(gameState.disconnectionIntervalId);
    gameState.userDisconnectedId = player.id;
    gameState.isPaused = true;

    let timeout = DISCONNECTION_END_GAME_TIMEMOUT;
    this.sendTo(gameState.roomId, 'playerDisconnection', {
      secondsUntilEnd: timeout,
      userId: player.id,
    });
    gameState.disconnectionIntervalId = setInterval(async () => {
      timeout -= 1;
      if (!timeout) {
        const winner = getOtherPlayer(gameState.game, player.id);
        try {
          await this.updatePlayerScore(gameState, winner, gameState.points);
          await this.handleGameEnd(gameState);
        } catch (error) {
          this.sendTo(gameState.roomId, 'error', {
            message: 'Error while setting game as finished.',
          });
        }
      }
      this.sendTo(gameState.roomId, 'playerDisconnection', {
        secondsUntilEnd: timeout,
        userId: player.id,
      });
    }, 1000);
  }

  async sendGameStartCountdown(game: GameType): Promise<void> {
    await new Promise((resolve) => {
      let countdown = 3;
      const intervalId = setInterval(() => {
        this.sendTo(game.roomId, 'startCountdown', countdown);
        if (countdown === 0) {
          clearInterval(intervalId);
          resolve(undefined);
        } else {
          countdown--;
        }
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
    clearInterval(game.disconnectionIntervalId);
    clearInterval(game.intervalId);

    const { playerOne, playerTwo } = game.game;
    const { winner } = getWinner(game);
    try {
      const playersRatingsChange = await this.players.updatePlayersRating(
        playerOne,
        playerTwo,
      );

      await this.gamesService.finishGame(
        game.gameId,
        winner.id,
        playersRatingsChange,
      );

      await this.updatePlayersAchievements(game, playersRatingsChange);

      this.sendGameEnd(game, playersRatingsChange, winner.id);
      this.sendLeaderboardUpdates(game, playersRatingsChange, winner.id);
      this.usersStatusGateway.setUserAsOnline(game.game.playerOne.id);
      this.usersStatusGateway.setUserAsOnline(game.game.playerTwo.id);
      this.games.delete(game.gameId);
    } catch (error) {
      this.gamesService.delete(game.gameId);
      this.usersStatusGateway.setUserAsOnline(game.game.playerOne.id);
      this.usersStatusGateway.setUserAsOnline(game.game.playerTwo.id);
      this.games.delete(game.gameId);
      throw error;
    }
  }

  @SubscribeMessage('playerMove')
  handlePlayerMove(client: Socket, data: WsPlayerMove) {
    const userId = this.extractUserId(client);
    const game = this.games.get(data.gameId);
    if (!game || game.isPaused) return;
    const { player } = getPlayer(game.game, 'id', userId);
    if (!player) return;

    handlePlayerMove(game.nextUpdateTime, player, data.move, () =>
      this.sendTo(game.roomId, 'playerMoveUpdate', player),
    );
  }

  async updatePlayersAchievements(
    game: GameType,
    playersRatingsChange: PlayersRatingChangesType,
  ) {
    if (game.userDisconnectedId !== undefined) return;

    const { playerOne, playerTwo } = game.game;
    const { winner, loser } = getWinner(game);

    const winnerWithRatingChange = {
      ...winner,
      ...playersRatingsChange[
        winner.id === playerOne.id ? 'playerOne' : 'playerTwo'
      ],
    };
    const loserWithRatingChange = {
      ...loser,
      ...playersRatingsChange[
        loser.id === playerOne.id ? 'playerOne' : 'playerTwo'
      ],
    };

    const playerOneAchievements =
      await this.achievementsService.updateUserAchievements(
        playerOne.id,
        winnerWithRatingChange,
        loserWithRatingChange,
        game,
      );
    this.sendAchievementsUpdates(playerOne.id, playerOneAchievements);

    const playerTwoAchievements =
      await this.achievementsService.updateUserAchievements(
        playerTwo.id,
        winnerWithRatingChange,
        loserWithRatingChange,
        game,
      );
    this.sendAchievementsUpdates(playerTwo.id, playerTwoAchievements);
  }

  sendGameEnd(
    game: GameType,
    ratingChanges: PlayersRatingChangesType,
    winnerId: number,
  ) {
    const { playerOne, playerTwo } = game.game;

    this.sendTo(game.roomId, 'gameEnd', {
      winnerId,
      playerOne: {
        score: playerOne.score,
        ratingChange: ratingChanges.playerOne.ratingChange,
      },
      playerTwo: {
        score: playerTwo.score,
        ratingChange: ratingChanges.playerTwo.ratingChange,
      },
    });
    this.sendToAll('liveGameEnd', game.gameId);
  }

  sendAchievementsUpdates(userId: number, achievements: UserAchievement[]) {
    if (achievements.length) {
      this.sendTo(userId.toString(), 'achievements', achievements);
    }
  }

  sendLeaderboardUpdates(
    game: GameType,
    ratingChanges: PlayersRatingChangesType,
    winnerId: number,
  ) {
    const { playerOne, playerTwo } = game.game;

    this.sendToAll('leaderboardUpdate', [
      {
        userId: playerOne.id,
        isWinner: winnerId === playerOne.id,
        ...ratingChanges.playerOne,
      },
      {
        userId: playerTwo.id,
        isWinner: winnerId === playerTwo.id,
        ...ratingChanges.playerTwo,
      },
    ]);
  }

  async updatePlayerScore(game: GameType, player: PlayerType, score: number) {
    player.score = score;
    const whichPlayer =
      player.id === game.game.playerOne.id ? 'playerOne' : 'playerTwo';
    await this.gamesService.updatePlayerScore(game.gameId, whichPlayer, score);
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

  sendTo<T extends string>(roomId: string, ev: T, payload: EmitPayloadType<T>) {
    this.server.to(roomId).emit(ev, payload);
  }

  sendToAll<T extends string>(ev: T, payload: EmitPayloadType<T>) {
    this.server.emit(ev as string, payload);
  }

  deleteRoom(roomId: string) {
    this.server.in(roomId).socketsLeave(roomId);
  }

  extractUserId(client: Socket) {
    return client.data.id;
  }
}
