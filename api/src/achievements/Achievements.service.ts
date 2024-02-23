import { Injectable } from '@nestjs/common';
import { Selectable, sql } from 'kysely';
import { db } from 'src/database';
import { PlayerRatingChangeType } from 'src/pong/players/players.service';
import {
  ACHIEVEMENTS,
  MARATHON_MAN_ACHIEVEMENT_TIME,
  QUICK_WITTED_ACHIEVEMENT_TIME,
  ROOKIE_RISER_LEVELS,
  SOCIAL_BUTTERFLY_LEVELS,
  VETERAN_LEVELS,
  WINNING_STREAK_LEVELS,
} from 'src/types/achievements';
import { GameType, PlayerType } from 'src/types/games/pongGameTypes';
import { Tuple } from 'src/types/games/socketPayloadTypes';
import { Achievement } from 'src/types/schema';

@Injectable()
export class AchievementsService {
  async updateUserAchievements(
    userId: number,
    winner: PlayerType & PlayerRatingChangeType,
    loser: PlayerType & PlayerRatingChangeType,
    game: GameType,
  ) {
    const achievements = await this.getUserAchievementQuery(
      winner.id,
    ).execute();

    const updatedAchievements: Selectable<Achievement>[] = [];
    const pushAchievement = (a: Selectable<Achievement>) =>
      updatedAchievements.push(a);

    if (userId === winner.id) {
      await this.handleFirstVictory(winner.id, achievements, pushAchievement);
      await this.handleUnderdogVictory(
        userId,
        winner.prevRating,
        loser.prevRating,
        achievements,
        pushAchievement,
      );
      await this.handleShutout(
        winner.id,
        loser.score,
        achievements,
        pushAchievement,
      );
      await this.handleRevenge(
        game.gameId,
        winner.id,
        loser.id,
        achievements,
        pushAchievement,
      );
    }

    await this.handleSocialButterfly(userId, achievements, pushAchievement);
    await this.handleWinningStreak(userId, achievements, pushAchievement);
    await this.handleVeteranPlayer(userId, achievements, pushAchievement);
    await this.handleMarathonMan(
      userId,
      game.startTime,
      achievements,
      pushAchievement,
    );
    await this.handleQuickWitted(
      userId,
      game.startTime,
      achievements,
      pushAchievement,
    );
    await this.handleRookieRiser(
      userId,
      winner.id === userId
        ? winner.prevRating + winner.ratingChange
        : loser.prevRating + loser.ratingChange,
      achievements,
      pushAchievement,
    );

    return updatedAchievements;
  }

  private async handleFirstVictory(
    winnerId: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.FIRST_VICTORY)) {
      pushAchievement(
        await this.unlock(winnerId, ACHIEVEMENTS.FIRST_VICTORY, 0),
      );
    }
  }

  private async handleUnderdogVictory(
    userId: number,
    winnerPrevRating: number,
    loserPrevRating: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.UNDERDOG_VICTORY)) {
      if (winnerPrevRating < loserPrevRating) {
        pushAchievement(
          await this.unlock(userId, ACHIEVEMENTS.UNDERDOG_VICTORY, 0),
        );
      }
    }
  }

  private async handleShutout(
    winnerId: number,
    loserScore: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.SHUTOUT)) {
      if (loserScore === 0) {
        pushAchievement(await this.unlock(winnerId, ACHIEVEMENTS.SHUTOUT, 0));
      }
    }
  }

  private async handleSocialButterfly(
    winnerId: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    const socialButterflyAchievement = achievements.find(
      (a) => a.type === ACHIEVEMENTS.SOCIAL_BUTTERFLY,
    );
    if (!socialButterflyAchievement) {
      const playersFacedCount = await this.getPlayersFacedCount(winnerId);
      if (playersFacedCount > SOCIAL_BUTTERFLY_LEVELS[1]) {
        pushAchievement(
          await this.unlock(winnerId, ACHIEVEMENTS.SOCIAL_BUTTERFLY, 1),
        );
      }
    } else if (SOCIAL_BUTTERFLY_LEVELS[socialButterflyAchievement.level + 1]) {
      const playersFacedCount = await this.getPlayersFacedCount(winnerId);
      if (
        playersFacedCount >
        SOCIAL_BUTTERFLY_LEVELS[socialButterflyAchievement.level + 1]
      ) {
        pushAchievement(
          await this.updateToNextLevel(winnerId, ACHIEVEMENTS.SOCIAL_BUTTERFLY),
        );
      }
    }
  }

  private async handleWinningStreak(
    winnerId: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    const winningStreakAchievement = achievements.find(
      (a) => a.type === ACHIEVEMENTS.WINNING_STREAK,
    );
    if (!winningStreakAchievement) {
      const isAchieved = await this.checkWinningStreak(
        winnerId,
        WINNING_STREAK_LEVELS[1],
      );
      if (isAchieved) {
        pushAchievement(
          await this.unlock(winnerId, ACHIEVEMENTS.WINNING_STREAK, 1),
        );
      }
    } else if (WINNING_STREAK_LEVELS[winningStreakAchievement.level + 1]) {
      const isAchieved = await this.checkWinningStreak(
        winnerId,
        WINNING_STREAK_LEVELS[winningStreakAchievement.level + 1],
      );
      if (isAchieved) {
        pushAchievement(
          await this.updateToNextLevel(winnerId, ACHIEVEMENTS.WINNING_STREAK),
        );
      }
    }
  }

  private async handleVeteranPlayer(
    winnerId: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    const veteranAchievement = achievements.find(
      (a) => a.type === ACHIEVEMENTS.VETERAN_PLAYER,
    );
    if (!veteranAchievement) {
      const gamesCount = await this.getGamesCount(winnerId);
      if (gamesCount > VETERAN_LEVELS[1]) {
        pushAchievement(
          await this.unlock(winnerId, ACHIEVEMENTS.VETERAN_PLAYER, 1),
        );
      }
    } else if (VETERAN_LEVELS[veteranAchievement.level + 1]) {
      const gamesCount = await this.getGamesCount(winnerId);
      if (gamesCount > VETERAN_LEVELS[veteranAchievement.level + 1]) {
        pushAchievement(
          await this.updateToNextLevel(winnerId, ACHIEVEMENTS.VETERAN_PLAYER),
        );
      }
    }
  }

  private async handleMarathonMan(
    userId: number,
    gameStartTime: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.MARATHON_MAN)) {
      if (Date.now() - gameStartTime >= MARATHON_MAN_ACHIEVEMENT_TIME) {
        pushAchievement(
          await this.unlock(userId, ACHIEVEMENTS.MARATHON_MAN, 0),
        );
      }
    }
  }

  private async handleQuickWitted(
    userId: number,
    gameStartTime: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.QUICK_WITTED)) {
      if (Date.now() - gameStartTime < QUICK_WITTED_ACHIEVEMENT_TIME) {
        pushAchievement(
          await this.unlock(userId, ACHIEVEMENTS.QUICK_WITTED, 0),
        );
      }
    }
  }

  private async handleRevenge(
    gameId: number,
    winnerId: number,
    loserId: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    if (!achievements.some((a) => a.type === ACHIEVEMENTS.REVENGE)) {
      const previousGameWithLoser = await this.getUsersPrevGame(gameId, [
        winnerId,
        loserId,
      ]);
      if (previousGameWithLoser && previousGameWithLoser.winnerId === loserId) {
        pushAchievement(await this.unlock(winnerId, ACHIEVEMENTS.REVENGE, 0));
      }
    }
  }

  private async handleRookieRiser(
    userId: number,
    newRating: number,
    achievements: Selectable<Achievement>[],
    pushAchievement: (a: Selectable<Achievement>) => void,
  ) {
    const achievement = achievements.find(
      (a) => a.type === ACHIEVEMENTS.ROOKIE_RISER,
    );
    if (!achievement) {
      if (newRating >= ROOKIE_RISER_LEVELS[0]) {
        pushAchievement(
          await this.unlock(userId, ACHIEVEMENTS.ROOKIE_RISER, 1),
        );
      }
    } else if (newRating >= ROOKIE_RISER_LEVELS[achievement.level]) {
      pushAchievement(
        await this.updateToNextLevel(userId, ACHIEVEMENTS.ROOKIE_RISER),
      );
    }
  }

  private async unlock(userId: number, type: ACHIEVEMENTS, level: number) {
    return await db
      .insertInto('achievement')
      .values({
        type: type,
        userId: userId,
        level: level,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  private async updateToNextLevel(userId: number, type: ACHIEVEMENTS) {
    return await db
      .updateTable('achievement')
      .where('userId', '=', userId)
      .where('type', '=', type)
      .set((eb) => {
        return {
          level: eb('level', '+', 1),
          updatedAt: sql`now()`,
        };
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  private async getUsersPrevGame(
    currentGameId: number,
    userIds: Tuple<number>,
  ) {
    return await db
      .selectFrom('game')
      .where('id', '!=', currentGameId)
      .where((eb) =>
        eb.or([
          eb.and([
            eb('playerOneId', '=', userIds[0]),
            eb('playerOneId', '=', userIds[0]),
          ]),
          eb.and([
            eb('playerOneId', '=', userIds[1]),
            eb('playerOneId', '=', userIds[0]),
          ]),
        ]),
      )
      .orderBy('createdAt desc')
      .selectAll()
      .executeTakeFirst();
  }

  private async checkWinningStreak(userId: number, winningStreak: number) {
    const userGames = await db
      .selectFrom('game')
      .where((eb) =>
        eb.or([eb('playerOneId', '=', userId), eb('playerTwoId', '=', userId)]),
      )
      .where('winnerId', 'is not', null)
      .orderBy('createdAt desc')
      .select('winnerId')
      .limit(winningStreak)
      .execute();

    let count = 0;
    for (const game of userGames) {
      if (game.winnerId !== userId) {
        return false;
      }
      count++;
    }
    return count === winningStreak;
  }

  private async getPlayersFacedCount(userId: number) {
    const count = await db
      .selectFrom((eb) =>
        eb
          .selectFrom('user')
          .where('user.id', '!=', userId)
          .innerJoin('game', (join) =>
            join.on((eb) =>
              eb.and([
                eb('playerOneId', '=', userId).or('playerTwoId', '=', userId),
                eb('playerOneId', '=', eb.ref('user.id')).or(
                  'playerTwoId',
                  '=',
                  eb.ref('user.id'),
                ),
              ]),
            ),
          )
          .select('user.id')
          .distinctOn('user.id')
          .as('userId'),
      )
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return !count ? 0 : count.count;
  }

  private async getGamesCount(userId: number) {
    const count = await db
      .selectFrom('game')
      .where((eb) =>
        eb('playerOneId', '=', userId).or('playerTwoId', '=', userId),
      )
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();
    return !count ? 0 : count.count;
  }

  getUserAchievementQuery(userId: number) {
    const achievements = db
      .selectFrom('achievement')
      .where('userId', '=', userId)
      .selectAll()
      .orderBy('createdAt desc');
    return achievements;
  }
}
