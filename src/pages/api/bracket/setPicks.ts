import { getDB } from '../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NewUserPick, UserPick } from '../../../common/types/bracket';
type SetPicksProps = Omit<UserPick, 'id' | 'timestamp'>;
interface SetPicksRequest extends NextApiRequest {
  body: { picks: (UserPick | NewUserPick)[][] };
}
type Data = { message: string };

export default async function handler(
  req: SetPicksRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'PUT') {
    try {
      let clientIp = '';
      if (typeof req.headers['x-forwarded-for'] === 'string') {
        clientIp =
          req.headers['x-forwarded-for'].split(',').pop()?.trim() || '';
      } else if (Array.isArray(req.headers['x-forwarded-for'])) {
        clientIp = req.headers['x-forwarded-for'][0];
      }
      if (!clientIp && req.socket?.remoteAddress) {
        clientIp = req.socket.remoteAddress;
      }

      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      let bracket_id = Number(req.body?.picks[0][0].bracket_id);

      // Can likely remove some of the select values as long as we keep the WHERE constraints
      const games = await db.manyOrNone(
        `
        SELECT
          b.published,
          b.publish_timestamp,
          b.restricted,
          g.bracket_id,
          g.key,
          g.winner
        FROM bracket b
        LEFT JOIN round r
        ON r.bracket_id = b.id
        LEFT JOIN game g
        ON g.round_id = r.id
        WHERE b.id = $1
          AND b.published = true
          AND ((b.publish_timestamp IS NULL) OR (now() > b.publish_timestamp))
          AND (now() > r.timestamp_start OR r.timestamp_start IS NULL)
          AND (now() < r.timestamp_end OR r.timestamp_end IS NULL)
          AND (now() < g.time OR g.time IS NULL)
          AND (winner = '')`,
        [bracket_id]
      );

      if (games[0].restricted === true) {
        const member = await db.oneOrNone(
          `
          SELECT
            id,
            member_user_id,
            accepted,
            role
          FROM bracket_member
          WHERE member_user_id = $1
            AND bracket_id = $2;`,
          [session.user.id, bracket_id]
        );
        if (!member) {
          return res.status(401).json({ message: 'Unauthorized.' });
        } else if (!member.accepted) {
          return res.status(401).json({ message: 'Must accept invite.' });
        }
      }

      // Create single array from the picks array of arrays (modeled after rounds)
      const picks: SetPicksProps[] = [];
      for (let round of req.body.picks) {
        for (let game of round) {
          if (games.findIndex((g) => g.key === game.game_key) > -1) {
            picks.push({
              ip: clientIp,
              user_id: session.user.id,
              bracket_id: bracket_id,
              game_key: String(game.game_key),
              player_1: String(game.player_1),
              player_2: String(game.player_2),
              winner: String(game.winner),
              player_1_score: Number(game.player_1_score),
              player_2_score: Number(game.player_2_score),
            });
          }
        }
      }

      const cs = new pgp.helpers.ColumnSet(
        [
          'ip',
          { name: 'timestamp', mod: '^', def: 'now()' },
          'user_id',
          'bracket_id',
          'game_key',
          'player_1',
          'player_2',
          'winner',
          'player_1_score',
          'player_2_score',
        ],
        { table: 'bracket_pick' }
      );

      const onConflict =
        ' ON CONFLICT ON CONSTRAINT bracket_pick_user_id_bracket_id_game_key_un DO UPDATE SET ' +
        cs.assignColumns({
          from: 'EXCLUDED',
          skip: ['ip', 'user_id', 'bracket_id', 'game_key'],
        });

      const upsert = pgp.helpers.insert(picks, cs) + onConflict; // generates upsert

      await db.none(upsert); // executes the query:

      return res.status(200).json({ message: 'Picks set.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not set picks.' });
    }
  }
}
