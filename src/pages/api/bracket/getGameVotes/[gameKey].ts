import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

import type { NextApiRequest, NextApiResponse } from 'next';
export type ScoreObject = {
  player_1_votes: number;
  player_2_votes: number;
} | null;
export type GetGameVotes = ScoreObject | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetGameVotes>
) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);

      await db.task(async (t) => {
        // If no session, only check if the bracket is restricted
        if (typeof session?.user?.id !== 'string') {
          const isRestricted = await t.one(
            `
            SELECT restricted
            FROM bracket b
            LEFT JOIN game g
              ON b.id = g.bracket_id
            WHERE g.key = $/gameKey/;`,
            {
              gameKey: req.query.gameKey,
            }
          );
          if (isRestricted === true) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
        } else {
          const access: {
            restricted: boolean;
            accepted: boolean;
            role: string;
          } | null = await t.oneOrNone(
            `
            SELECT b.restricted, bm.accepted, bm.role
            FROM bracket b
            LEFT JOIN bracket_member bm
              ON b.id = bm.bracket_id AND bm.member_user_id = $/user_id/
            LEFT JOIN game g
              ON b.id = g.bracket_id
            WHERE g.key = $/gameKey/;`,
            {
              user_id: session.user.id,
              gameKey: req.query.gameKey,
            }
          );

          if (!access) {
            return res.status(404).json({ message: 'Bracket not found.' });
          } else if (access.restricted === true) {
            if (access.accepted === false) {
              return res
                .status(401)
                .json({ message: 'Please accept your bracket invite.' });
            } else if (access.accepted === null) {
              return res.status(401).json({ message: 'Unauthorized' });
            }
          }
        }

        let players = await t.oneOrNone(
          `
          SELECT
            player_1,
            player_2
          FROM game
          WHERE key = $1;`,
          [req.query.gameKey]
        );

        let score: ScoreObject = await t.oneOrNone(
          `
            SELECT
            sum(case when game_key = $/gameKey/ and participant_key = $/player1/ then 1 else 0 end) AS player_1_votes,
            sum(case when game_key = $/gameKey/ and participant_key = $/player2/ then 1 else 0 end) AS player_2_votes
            FROM bracket_vote;`,
          {
            gameKey: req.query.gameKey,
            player1: players.player_1,
            player2: players.player_2,
          }
        );

        return res.status(200).json(score);
      });
    } catch (err) {
      console.error(err);
      console.error('Could not get game votes.');
      res.status(500).json({ message: 'Could not get game votes.' });
    }
  }
}
