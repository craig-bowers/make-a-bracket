import { getDB } from '../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BracketListing } from '../../../common/types/bracket';
interface BracketListingsRequest extends NextApiRequest {
  query: { offset: string; limit: string };
}
export type UserBrackets =
  | {
      brackets: BracketListing[];
      canLoadMore: boolean;
    }
  | { message: string };

export default async function handler(
  req: BracketListingsRequest,
  res: NextApiResponse<UserBrackets>
) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      let defaultOffset = 0;
      let defaultLimit = 20;

      let offset =
        typeof req.query.offset === 'string'
          ? parseInt(req.query.offset)
          : defaultOffset;
      let limit =
        typeof req.query.limit === 'string'
          ? parseInt(req.query.limit)
          : defaultLimit;
      if (limit > 100)
        return res.status(400).json({ message: 'Over limit (100)' });

      let someBrackets: BracketListing[] = await db.query(
        `
        SELECT
          b.id,
          b.published,
          b.publish_timestamp,
          b.create_timestamp,
          b.create_user_id,
          b.modify_timestamp,
          b.modify_user_id,
          b.bracket_type,
          b.name,
          b.slug,
          b.image,
          b.description,
          b.rules,
          b.visibility,
          b.restricted,
          m.role
        FROM bracket b
        LEFT JOIN bracket_member m
        ON m.bracket_id = b.id
        WHERE
          m.member_user_id = $/userId/
          AND accepted = true
          AND role IN ('owner', 'admin')
        ORDER BY m.id DESC
        LIMIT $/limit/
        OFFSET $/offset/;`,
        { userId: session.user.id, limit: limit, offset: offset }
      );

      return res.status(200).json({
        brackets: someBrackets,
        canLoadMore: (limit || defaultLimit) <= someBrackets.length,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not get brackets.' });
    }
  }
}
