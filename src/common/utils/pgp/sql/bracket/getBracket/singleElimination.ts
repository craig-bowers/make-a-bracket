import type pgPromise from 'pg-promise';
import type { Bracket, UserPick } from '../../../../../types/bracket';

export async function singleElimination(
  db: pgPromise.IDatabase<any>,
  bracket: Bracket,
  userId: string
) {
  try {
    let picksSingleArray: UserPick[] = await db.manyOrNone(
      `
      SELECT
        id,
        timestamp,
        user_id,
        bracket_id,
        game_key,
        player_1,
        player_2,
        winner,
        player_1_score,
        player_2_score
      FROM bracket_pick
      WHERE bracket_id = $/bracket_id/
        AND user_id = $/user_id/;`,
      { bracket_id: bracket.settings.id, user_id: userId }
    );

    if (picksSingleArray.length > 0) {
      // If there are no picks we create an empty object on the client side
      bracket.picks = bracket.rounds.map((round) => {
        return round.games.map((game) => {
          const pick = picksSingleArray.find(
            (pick) => pick.game_key === game.key
          );
          if (!pick)
            // When a user submits picks it creates entries for all games, so this shouldn't happen often or ever
            return {
              bracket_id: bracket.settings.id,
              game_key: game.key,
              player_1: game.player_1,
              player_2: game.player_2,
              winner: '',
              player_1_score: null,
              player_2_score: null,
            };
          else return pick;
        });
      });
    }

    return bracket;
  } catch (err) {
    console.error(err);
    return bracket;
  }
}
