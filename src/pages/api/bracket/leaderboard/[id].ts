import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { LeaderboardUser } from '../../../../common/types/bracket';
export type LeaderboardData = LeaderboardUser[] | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeaderboardData>
) {
  if (req.method === 'GET') {
    try {
      // Get bracket ID from query
      let bracket_id = Number(req.query.id);
      if (isNaN(bracket_id) || bracket_id === 0)
        return res.status(400).json({ message: 'Not a valid bracket ID.' });
      // Check session
      const session = await getServerSession(req, res, authOptions);

      // If no session, only check if the bracket is restricted
      if (typeof session?.user?.id !== 'string') {
        const isRestricted = await db.one(
          `
          SELECT restricted
          FROM bracket
          WHERE id = $/bracket_id/;`,
          {
            bracket_id: bracket_id,
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
        } | null = await db.oneOrNone(
          `
          SELECT b.restricted, bm.accepted, bm.role
          FROM bracket b
          LEFT JOIN bracket_member bm
            ON b.id = bm.bracket_id AND bm.member_user_id = $/user_id/
          WHERE b.id = $/bracket_id/;`,
          {
            user_id: session.user.id,
            bracket_id: bracket_id,
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

      const leaderboard = await db.query(
        `
        SELECT
          -- COALESCE(u.display_name, u.name) AS name,
          u.id,
          u.name,
          u.display_name,
          array_agg(points ORDER BY round_id) AS rounds,
          SUM(points) AS total
        FROM bracket_leaderboard bl
        JOIN users u ON bl.user_id = u.id
        WHERE bl.round_id IN (
          SELECT id
          FROM round
          WHERE bracket_id = $/bracket_id/
        )
        GROUP BY u.id, u.display_name, u.name
        ORDER BY total DESC;`,
        { bracket_id: bracket_id }
      );

      return res.status(200).json(leaderboard);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not get leaderboard.' });
    }
  }
}
