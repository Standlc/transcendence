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
} from '../games/players/players.service';
import { Game } from 'src/types/schema';
import { Selectable } from 'kysely';
import { initialize, startGameInterval } from './gameLogic/game';
import {
  GameStateType,
  GameType,
  PlayerType,
} from 'src/types/gameServer/pongGameTypes';
import {
  EmitPayloadType,
  WsGameIdType,
  WsPlayerMove,
} from 'src/types/gameServer/socketPayloadTypes';
import { getOtherPlayer, getWinner } from './gameLogic/utils';
import {
  DISCONNECTION_END_GAME_TIMEMOUT,
  INTERVAL_MS,
  PLAYER_PING_INTERVAL,
} from './gameLogic/constants';
import { handlePlayerMove } from './gameLogic/paddle';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { AchievementsService } from 'src/achievements/Achievements.service';
import { UserAchievement } from 'src/types/achievements';
import { UserGameInvitation } from 'src/types/gameRequests';

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

  async startGame(gameRecord: Selectable<Game>) {
    const gameState = initialize(gameRecord);
    this.games.set(gameState.gameId, gameState);
    this.joinUsersToGameRoom(gameRecord, gameState.roomId);
    this.usersStatusGateway.setUserAsPlaying(gameRecord.playerOneId);
    this.usersStatusGateway.setUserAsPlaying(gameRecord.playerTwoId);

    if (gameRecord.isPublic) {
      this.emitNewLiveGame(gameState);
    }

    this.sendTo(gameState.roomId, 'gameStart', gameState.roomId);
    await this.sendGameStartCountdown(gameState);
    gameState.isPaused = false;

    const now = Date.now();
    gameState.startTime = now;
    gameState.nextUpdateTime = now + INTERVAL_MS;

    this.runGame(
      gameState,
      gameRecord.isPublic
        ? {
            onPlayerScore: () => {
              this.sendLiveGameUpdate(gameState);
            },
            onGameEnd: async () => {
              await this.handlePublicGameEnd(gameState);
            },
          }
        : {
            onPlayerScore: () => {},
            onGameEnd: async () => {
              await this.handlePrivateGameEnd(gameState);
            },
          },
    );
  }

  async joinUsersToGameRoom(gameRecord: Selectable<Game>, roomId: string) {
    this.server.in(gameRecord.playerOneId.toString()).socketsJoin(roomId);
    this.server.in(gameRecord.playerTwoId.toString()).socketsJoin(roomId);

    // console.log(
    //   'Player One sockets',
    //   (await this.server.in(gameRecord.playerOneId.toString()).fetchSockets()).length,
    // );
    // console.log(
    //   'Player Two sockets',
    //   (await this.server.in(gameRecord.playerTwoId.toString()).fetchSockets()).length,
    // );
  }

  async runGame(
    gameState: GameType,
    {
      onPlayerScore,
      onGameEnd,
    }: {
      onPlayerScore: () => void;
      onGameEnd: () => Promise<void>;
    },
  ) {
    const handleEmitGameState = () => {
      this.sendTo(gameState.roomId, 'updateGameState', gameState.game);
    };

    const handleGameEnd = async () => {
      clearInterval(gameState.disconnectionIntervalId);
      clearInterval(gameState.intervalId);
      try {
        await onGameEnd();
      } catch (error) {
        try {
          await this.gamesService.delete(gameState.gameId);
        } catch (error) {
          this.sendTo(gameState.roomId, 'error', {
            message: 'Error while deleting game.',
          });
        }
        this.sendTo(gameState.roomId, 'error', {
          message: 'Error while setting game as finished.',
        });
      }
      this.usersStatusGateway.setUserAsOnline(gameState.game.playerOne.id);
      this.usersStatusGateway.setUserAsOnline(gameState.game.playerTwo.id);
      this.games.delete(gameState.gameId);
    };

    const handlePlayerScore = async (player: PlayerType, score?: number) => {
      try {
        const newScore = score !== undefined ? score : player.score + 1;
        await this.updatePlayerScore(gameState, player, newScore);
        onPlayerScore();
      } catch (error) {
        this.sendTo(gameState.roomId, 'error', {
          message: 'Error while updating player score.',
        });
      }
    };

    const handlePlayersConnectivity = async (now: number) => {
      const { playerOne, playerTwo } = gameState.game;

      let disconnectedPlayerId: number | undefined = undefined;
      if (now - playerOne.lastPingTime >= PLAYER_PING_INTERVAL + 500) {
        disconnectedPlayerId = playerOne.id;
      } else if (now - playerTwo.lastPingTime >= PLAYER_PING_INTERVAL + 500) {
        disconnectedPlayerId = playerTwo.id;
      }

      if (disconnectedPlayerId !== undefined) {
        this.handlePlayerDisconnection(
          disconnectedPlayerId,
          gameState,
          async (userId) => {
            const winner = getOtherPlayer(gameState.game, userId);
            await handlePlayerScore(winner, gameState.points);
            await handleGameEnd();
          },
        );
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

  handlePlayerDisconnection(
    userId: number,
    gameState: GameType,
    onTimeout: (id: number) => void,
  ) {
    clearInterval(gameState.disconnectionIntervalId);
    gameState.userDisconnectedId = userId;
    gameState.isPaused = true;

    let timeout = DISCONNECTION_END_GAME_TIMEMOUT;
    this.sendTo(gameState.roomId, 'playerDisconnection', {
      secondsUntilEnd: timeout,
      userId: userId,
    });

    gameState.disconnectionIntervalId = setInterval(() => {
      timeout -= 1;
      if (!timeout) {
        clearTimeout(gameState.disconnectionIntervalId);
        onTimeout(userId);
      }
      this.sendTo(gameState.roomId, 'playerDisconnection', {
        secondsUntilEnd: timeout,
        userId: userId,
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

  async handlePrivateGameEnd(game: GameType) {
    const { winner } = getWinner(game);
    const updatedGameRecord = await this.gamesService.finishGame(
      game.gameId,
      winner.id,
    );
    this.sendTo(game.roomId, 'gameEnd', updatedGameRecord);
  }

  async handlePublicGameEnd(game: GameType) {
    const { playerOne, playerTwo } = game.game;
    const { winner } = getWinner(game);
    const playersRatingsChange = await this.players.updatePlayersRating(
      playerOne,
      playerTwo,
    );

    const updatedGameRecord = await this.gamesService.finishGame(
      game.gameId,
      winner.id,
      playersRatingsChange,
    );

    await this.updatePlayersAchievements(game, playersRatingsChange);
    this.sendTo(game.roomId, 'gameEnd', updatedGameRecord);
    this.sendToAll('liveGameEnd', game.gameId);
    this.sendLeaderboardUpdates(game, playersRatingsChange, winner.id);
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

  sendGameInvitation(invite: UserGameInvitation) {
    this.sendTo(invite.targetUser.id.toString(), 'gameInvitation', invite);
  }

  sendGameInvitationRefused(inviterId: number) {
    this.sendTo(inviterId.toString(), 'gameInvitationRefused', undefined);
  }

  sendGameInvitationCanceled({
    targetId,
    inviterId,
  }: {
    targetId: number;
    inviterId: number;
  }) {
    this.sendTo(targetId.toString(), 'gameInvitationCanceled', {
      inviterId: inviterId,
    });
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

  sendTo<T extends keyof EmitPayloadType>(
    roomId: string,
    ev: T,
    payload: EmitPayloadType[T],
  ) {
    this.server.to(roomId).emit(ev, payload);
  }

  sendToAll<T extends keyof EmitPayloadType>(
    ev: T,
    payload: EmitPayloadType[T],
  ) {
    this.server.emit(ev as string, payload);
  }

  deleteRoom(roomId: string) {
    this.server.in(roomId).socketsLeave(roomId);
  }

  extractUserId(client: Socket) {
    return client.data.id;
  }
}
