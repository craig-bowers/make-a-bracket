import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

import type { NextApiRequest, NextApiResponse } from 'next';
import { Round, Game } from '../../../../common/types/bracket';
type UpdateRound = Pick<
  Round,
  | 'id'
  | 'bracket_id'
  | 'modify_user_id'
  | 'name'
  | 'timestamp_start'
  | 'timestamp_end'
  | 'ppg'
>;
type UpdateGame = Pick<
  Game,
  | 'id'
  | 'modify_user_id'
  | 'bracket_id'
  | 'name'
  | 'player_1'
  | 'player_2'
  | 'winner'
  | 'player_1_score'
  | 'player_2_score'
  | 'time'
  | 'location'
  | 'details'
>;
interface EditRoundsRequest extends NextApiRequest {
  body: { rounds: Round[] };
}
type Data = { message: string };

export default async function handler(
  req: EditRoundsRequest,
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
      } else if (!req.body.rounds) {
        return res.status(400).json({ message: 'Missing rounds.' });
      }

      let rounds: UpdateRound[] = req.body.rounds.map((r) => {
        return {
          id: r.id,
          bracket_id: r.bracket_id,
          modify_user_id: session.user.id ?? null,
          name: r.name,
          timestamp_start: r.timestamp_start || null,
          timestamp_end: r.timestamp_end || null,
          ppg: r.ppg || 1,
        };
      });

      const roundsCs = new pgp.helpers.ColumnSet(
        [
          '?id',
          '?bracket_id',
          { name: 'modify_timestamp', mod: '^', def: 'now()' },
          'modify_user_id',
          'name',
          { name: 'timestamp_start', cast: 'timestamp' },
          { name: 'timestamp_end', cast: 'timestamp' },
          'ppg',
        ],
        { table: 'round' }
      );

      const roundsUpdate =
        pgp.helpers.update(rounds, roundsCs) +
        ' WHERE v.id = t.id' +
        pgp.as.format(' AND t.bracket_id = $1', [rounds[0].bracket_id]);

      let games: UpdateGame[] = [];
      for (let round of req.body.rounds) {
        for (let game of round.games) {
          games.push({
            id: Number(game.id),
            modify_user_id: session.user.id,
            bracket_id: game.bracket_id,
            name: game.name,
            player_1: game.player_1,
            player_2: game.player_2,
            winner: game.winner,
            player_1_score: game.player_1_score,
            player_2_score: game.player_2_score,
            time: game.time,
            location: game.location,
            details: game.details,
          });
        }
      }

      const gamesCs = new pgp.helpers.ColumnSet(
        [
          '?id',
          { name: 'modify_timestamp', mod: '^', def: 'now()' },
          'modify_user_id',
          '?bracket_id',
          'name',
          'player_1',
          'player_2',
          'winner',
          { name: 'player_1_score', cast: 'integer' },
          { name: 'player_2_score', cast: 'integer' },
          { name: 'time', cast: 'timestamp' },
          { name: 'location', cast: 'jsonb' },
          { name: 'details', cast: 'json' },
        ],
        { table: 'game' }
      );

      const gamesUpdate =
        pgp.helpers.update(games, gamesCs) +
        ' WHERE v.id = t.id' +
        pgp.as.format(' AND t.bracket_id = $1', [rounds[0].bracket_id]);

      await db.task(async (t) => {
        const access = await t.oneOrNone(
          `
          SELECT
            b.bracket_type,
            m.member_user_id,
            m.accepted,
            m.role
          FROM bracket_member m
          LEFT JOIN bracket b ON b.id = m.bracket_id
          WHERE (member_user_id = $1 AND role IN ('admin', 'owner'))
            AND bracket_id = $2;`,
          [session.user.id, rounds[0].bracket_id]
        );

        if (!access) {
          return res.status(401).json({ message: 'Unauthorized' });
        } else if (access.accepted === false) {
          return res
            .status(401)
            .json({ message: 'Please accept your bracket invite.' });
        }

        await t.none(roundsUpdate);
        await t.none(gamesUpdate);

        // Calculate bracket scores if bracket is not a voting bracket
        if (!access.bracket_type.includes('voting')) {
          await t.none(
            `
            WITH round_scores AS (
              SELECT
                bp.user_id,
                r.bracket_id AS bracket_id,
                r.id AS round_id,
                SUM(CASE WHEN bp.winner = g.winner THEN r.ppg ELSE 0 END) AS points
              FROM
                round r
                JOIN game g ON r.id = g.round_id
                JOIN bracket_pick bp ON g."key" = bp.game_key
              WHERE
                r.bracket_id = $/bracket_id/
              GROUP BY
                bp.user_id, r.id
              )
              INSERT INTO bracket_leaderboard (user_id, bracket_id, round_id, points)
              SELECT
                user_id,
                bracket_id,
                round_id,
                points
              FROM
                round_scores
              ON CONFLICT ON CONSTRAINT bracket_leaderboard_user_id_round_id_un
              DO UPDATE SET
                points = EXCLUDED.points;`,
            { bracket_id: rounds[0].bracket_id }
          );
        }
      });

      return res.status(200).json({ message: 'Bracket updated.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating bracket.' });
    }
  }
}
