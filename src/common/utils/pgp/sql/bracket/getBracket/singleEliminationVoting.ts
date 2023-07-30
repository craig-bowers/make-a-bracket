import type pgPromise from 'pg-promise';
import type { Bracket } from '../../../../../types/bracket';

// Check round deadlines. If no winner & past deadline, determine winner.
export async function singleEliminationVoting(
  db: pgPromise.IDatabase<any>,
  bracket: Bracket,
  userId?: string
) {
  try {
    for (let [roundIndex, round] of bracket.rounds.entries()) {
      if (round.timestamp_end && new Date() > new Date(round.timestamp_end)) {
        for (let [gameIndex, game] of round.games.entries()) {
          let player_1 = bracket?.participants?.find(
            (participant) => participant?.key === game?.player_1
          );
          let player_2 = bracket?.participants?.find(
            (participant) => participant?.key === game?.player_2
          );

          if (!game.winner) {
            let score = await db.oneOrNone(
              `
              SELECT
                sum(case when game_key = $/gameKey/ and participant_key = $/player1/ then 1 else 0 end) AS player_1_votes,
                sum(case when game_key = $/gameKey/ and participant_key = $/player2/ then 1 else 0 end) AS player_2_votes
              FROM bracket_vote;`,
              {
                gameKey: game.key,
                player1: player_1?.key || '',
                player2: player_2?.key || '',
              }
            );
            // Determine winner
            // Voting tiebreaker currently determined by seed (player_1)
            // Later, we may switch to participant.ranking or RNG
            let winner: string = '';
            if (score.player_1_votes === score.player_2_votes) {
              winner = player_1?.key || '';
            } else {
              score.player_1_votes > score.player_2_votes
                ? (winner = player_1?.key || '')
                : (winner = player_2?.key || '');
            }
            // Update winner in game object & db
            game.winner = winner;
            await db.none(
              `
                UPDATE game
                SET winner = $1
                WHERE id = $2;`,
              [winner, game.id]
            );
            // If we update any games we'll need to re-fetch the updated data. This won't happen that often. Only when determining round winners.
            if (
              bracket.rounds?.[roundIndex + 1]?.games?.[
                Math.floor(gameIndex / 2)
              ]
            ) {
              // Add winner to next game object & db
              if (gameIndex % 2 === 0) {
                bracket.rounds[roundIndex + 1].games[
                  Math.floor(gameIndex / 2)
                ].player_1 = winner || '';
                await db.none(
                  `
                  UPDATE game
                  SET player_1 = $1
                  WHERE id = $2;`,
                  [
                    winner,
                    bracket.rounds[roundIndex + 1].games[
                      Math.floor(gameIndex / 2)
                    ].id,
                  ]
                );
              } else {
                bracket.rounds[roundIndex + 1].games[
                  Math.floor(gameIndex / 2)
                ].player_2 = winner || '';
                await db.none(
                  `
                  UPDATE game
                  SET player_2 = $1
                  WHERE id = $2;`,
                  [
                    winner,
                    bracket.rounds[roundIndex + 1].games[
                      Math.floor(gameIndex / 2)
                    ].id,
                  ]
                );
              }
            }
          }
        }
      }
    }

    bracket.votes = {
      user: [],
      games: {},
    };

    if (userId) {
      let userVotes = await db.manyOrNone(
        `
        SELECT
          id,
          timestamp,
          user_id,
          bracket_id,
          game_key,
          participant_key
        FROM bracket_vote
        WHERE user_id = $1
        AND bracket_id = $2;`,
        [userId, bracket.settings.id]
      );
      bracket.votes.user = JSON.parse(JSON.stringify(userVotes));
    }

    return bracket;
  } catch (err) {
    console.error(err);
    return bracket;
  }
}
