import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from 'src/database';
import { calculatePlayersNewRatings } from './ratings';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';
import { PlayerType } from 'src/types/gameServer/pongGameTypes';
import { LeaderbordPlayer } from 'src/types/games';

export type PlayersRatingChangesType = {
  playerOne: PlayerRatingChangeType;
  playerTwo: PlayerRatingChangeType;
};

export type PlayerRatingChangeType = {
  ratingChange: number;
  prevRating: number;
};

@Injectable()
export class PlayersService {
  constructor(private readonly usersStatusGateway: UsersStatusGateway) {}

  async updatePlayersRating(playerOne: PlayerType, playerTwo: PlayerType) {
    const userRatings = await this.getUsersRating([playerOne.id, playerTwo.id]);
    const playerOneRating = userRatings.get(playerOne.id);
    const playerTwoRating = userRatings.get(playerTwo.id);
    if (!playerOneRating || !playerTwoRating) {
      throw new InternalServerErrorException();
    }

    const [playerOneRatingChange, playerTwoRatingChange] =
      calculatePlayersNewRatings([
        {
          score: playerOne.score,
          rating: playerOneRating,
        },
        {
          score: playerTwo.score,
          rating: playerTwoRating,
        },
      ]);

    await this.updateRating(playerOne.id, playerOneRatingChange);
    await this.updateRating(playerTwo.id, playerTwoRatingChange);

    return {
      playerOne: {
        ratingChange: playerOneRatingChange,
        prevRating: playerOneRating,
      },
      playerTwo: {
        ratingChange: playerTwoRatingChange,
        prevRating: playerTwoRating,
      },
    };
  }

  async getLeaderboard(limit?: number): Promise<LeaderbordPlayer[]> {
    const leaderboard = await this.selectPlayerInfos()
      .orderBy('rating desc')
      .$if(limit !== undefined, (eb) => eb.limit(limit ?? 0))
      .execute();

    const leaderboardWithStatus = leaderboard.map((player) => {
      return {
        ...player,
        status: this.usersStatusGateway.getUserStatus(player.id),
      };
    });
    return leaderboardWithStatus;
  }

  async getLeaderboardInfo(userIds: number[]): Promise<LeaderbordPlayer[]> {
    const playerInfos = await this.selectPlayerInfos()
      .where('user.id', 'in', userIds)
      .execute();
    const leaderboardWithStatus = playerInfos.map((player) => {
      return {
        ...player,
        status: this.usersStatusGateway.getUserStatus(player.id),
      };
    });
    return leaderboardWithStatus;
  }

  private selectPlayerInfos() {
    return db
      .selectFrom('user')
      .innerJoin('game as playerGames', (join) =>
        join.on((eb) =>
          eb
            .or([
              eb('playerGames.playerOneId', '=', eb.ref('user.id')),
              eb('playerGames.playerTwoId', '=', eb.ref('user.id')),
            ])
            .and('playerGames.winnerId', 'is not', null)
            .and('playerGames.isPublic', 'is', true),
        ),
      )
      .select((eb) => [
        eb.fn
          .count<number>((eb) =>
            eb
              .case()
              .when('playerGames.winnerId', '=', eb.ref('user.id'))
              .then(1)
              .end(),
          )
          .as('wins'),
        eb.fn
          .count<number>((eb) =>
            eb
              .case()
              .when('playerGames.winnerId', '!=', eb.ref('user.id'))
              .then(1)
              .end(),
          )
          .as('losses'),
      ])
      .groupBy('user.id')
      .select(['user.id', 'username', 'user.bio', 'user.avatarUrl', 'rating']);
  }

  async getUsersRating(userIds: number[]): Promise<Map<number, number>> {
    const users = await db
      .selectFrom('user')
      .where('id', 'in', userIds)
      .select(['id', 'rating'])
      .execute();

    if (users.length !== userIds.length) {
      throw new InternalServerErrorException();
    }

    const userIdUserRatingMap = new Map<number, number>();
    users.forEach((user) => {
      userIdUserRatingMap.set(user.id, user.rating);
    });
    return userIdUserRatingMap;
  }

  async updateRating(userId: number, ratingChange: number) {
    await db
      .updateTable('user')
      .where('user.id', '=', userId)
      .set((eb) => {
        return {
          rating: eb('rating', '+', ratingChange),
        };
      })
      .execute();
  }
}
