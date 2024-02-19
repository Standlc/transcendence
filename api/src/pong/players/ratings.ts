import { Tuple } from 'src/types/games/socketPayloadTypes';

export const C = 500;
export const K = 64;

export const getExponentialRating = (rating: number) => {
  return 5 ** (rating / C);
};

export const getPlayerExpectedOutcome = (
  playerExpRating: number,
  opponentExpRating: number,
) => {
  return playerExpRating / (playerExpRating + opponentExpRating);
};

export const getPlayerGameOutcome = (
  playerScore: number,
  opponentScore: number,
) => {
  return playerScore / (playerScore + opponentScore);
};

export const getNewRatingPlayerRating = (
  playerRating: number,
  playerGameOutcome: number,
  playerExpectedOutcome: number,
) => {
  return playerRating + K * (playerGameOutcome - playerExpectedOutcome);
};

export const calculatePlayersNewRatings = (
  players: Tuple<{ score: number; rating: number }>,
) => {
  if (players[0].score === 0 && players[1].score === 0) {
    return {
      newRatingPlayer1: players[0].rating,
      newRatingPlayer2: players[1].rating,
    };
  }

  const QPlayer1 = getExponentialRating(players[0].rating);
  const QPlayer2 = getExponentialRating(players[1].rating);
  const EPlayer1 = getPlayerExpectedOutcome(QPlayer1, QPlayer2);
  const EPlayer2 = getPlayerExpectedOutcome(QPlayer2, QPlayer1);
  const SPlayer1 = getPlayerGameOutcome(players[0].score, players[1].score);
  const SPlayer2 = getPlayerGameOutcome(players[1].score, players[0].score);

  const newRatingPlayer1 = getNewRatingPlayerRating(
    players[0].rating,
    SPlayer1,
    EPlayer1,
  );
  const newRatingPlayer2 = getNewRatingPlayerRating(
    players[1].rating,
    SPlayer2,
    EPlayer2,
  );

  return {
    newRatingPlayer1: Math.floor(newRatingPlayer1),
    newRatingPlayer2: Math.floor(newRatingPlayer2),
  };
};
