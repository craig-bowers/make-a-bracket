import type { NextApiRequest, NextApiResponse } from 'next';

import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// interface PublishBracketRequest extends NextApiRequest {
//   body: { bracket_id: number };
// }
type Data = { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'DELETE') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      let bracket_id: number;
      if (!req?.query?.id && !Number.isInteger(Number(req.query.id))) {
        return res.status(400).json({ message: 'Not a valid bracket.' });
      }
      bracket_id = Number(req.query.id);

      await db.task(async (t) => {
        const access = await t.oneOrNone(
          `
          SELECT
            member_user_id,
            accepted,
            role
          FROM bracket_member
          WHERE (member_user_id = $1 AND role IN ('admin', 'owner'))
            AND bracket_id = $2;`,
          [session.user.id, bracket_id]
        );

        if (!access) {
          return res.status(401).json({ message: 'Unauthorized' });
        } else if (access.accepted === false) {
          return res
            .status(401)
            .json({ message: 'Please accept your bracket invite.' });
        }

        // DELETE DATABASE TABLES including (via foreign key cascade)
        // bracket_category
        // bracket_leaderboard
        // bracket_pick
        // bracket_vote
        // game
        // round
        // participant
        // bracket_member
        // bracket

        await db.none(
          `
            DELETE FROM bracket
            WHERE id = $1;`,
          [bracket_id]
        );
      });

      return res.status(200).json({ message: 'Bracket deleted.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error deleting bracket.' });
    }
  }
}
