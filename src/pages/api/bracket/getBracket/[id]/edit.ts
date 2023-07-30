import { getDB, sql } from '../../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Bracket } from '../../../../../common/types/bracket';
export type GetEditBracketData = Bracket | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetEditBracketData>
) {
  if (req.method === 'GET') {
    try {
      let bracketId = Number(req.query.id);
      if (isNaN(bracketId) || bracketId === 0)
        return res.status(400).json({ message: 'Not a valid bracket ID.' });
      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      await db.task(async (t) => {
        if (typeof session?.user?.id !== 'string') {
          return res.status(401).json({ message: 'You must be logged in.' });
        }
        const access = await t.oneOrNone(
          `
          SELECT
            member_user_id,
            accepted,
            role
          FROM bracket_member
          WHERE (member_user_id = $1 AND role IN ('admin', 'owner'))
            AND bracket_id = $2;`,
          [session.user.id, bracketId]
        );

        if (!access) {
          return res.status(401).json({ message: 'Unauthorized' });
        } else if (access.accepted === false) {
          return res
            .status(401)
            .json({ message: 'Please accept your bracket invite.' });
        }

        let bracket = await sql.bracket.getBracket(
          t,
          bracketId,
          session.user.id
        );

        if ('error' in bracket) {
          return res
            .status(bracket.error.code)
            .json({ message: bracket.error.message });
        }

        return res.status(200).json(bracket);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not get bracket.' });
    }
  }
}
