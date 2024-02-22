import { Injectable } from '@nestjs/common';
import { db } from 'src/database';
import { LeaderbordPlayer } from 'src/types/games/games';
import { Tuple } from 'src/types/games/socketPayloadTypes';
import { calculatePlayersNewRatings } from './ratings';
import { UsersStatusGateway } from 'src/usersStatusGateway/UsersStatus.gateway';

@Injectable()
export class PlayersService {
  constructor(private readonly usersStatusGateway: UsersStatusGateway) {}

  async updatePlayersRating(
    players: Tuple<{ id: number; score: number }>,
  ): Promise<Tuple<{ rating: number; id: number }>> {
    const playersWithRating = [
      { ...players[0], rating: 0 },
      { ...players[1], rating: 0 },
    ];

    const ratings = await this.getUsersRating([players[0].id, players[1].id]);
    if (ratings.length !== 2) {
      throw new Error("Players's ratings could not be upadted");
    }

    playersWithRating.forEach((player) => {
      const rating = ratings.find((r) => r.id === player.id);
      if (rating) player.rating = rating.rating;
    });

    const { newRatingPlayer1, newRatingPlayer2 } = calculatePlayersNewRatings([
      {
        score: playersWithRating[0].score,
        rating: playersWithRating[0].rating,
      },
      {
        score: playersWithRating[1].score,
        rating: playersWithRating[1].rating,
      },
    ]);

    await this.updateRating(players[0].id, newRatingPlayer1);
    await this.updateRating(players[1].id, newRatingPlayer2);
    return [
      { rating: newRatingPlayer1, id: players[0].id },
      { rating: newRatingPlayer2, id: players[1].id },
    ];
  }

  async getLeaderboard(limit: number): Promise<LeaderbordPlayer[]> {
    const leaderboard = await this.selectPlayerInfos()
      .orderBy('rating desc')
      .limit(limit)
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
            .and('playerGames.winnerId', 'is not', null),
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

  async getUsersRating(userIds: number[]) {
    const users = await db
      .selectFrom('user')
      .where('id', 'in', userIds)
      .select(['id', 'rating'])
      .execute();
    return users;
  }

  async updateRating(userId: number, rating: number) {
    await db
      .updateTable('user')
      .where('user.id', '=', userId)
      .set({
        rating: rating,
      })
      .execute();
  }
}
