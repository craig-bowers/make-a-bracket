import { getDB } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BracketListing } from '../../../../common/types/bracket';

export type InvitesData = BracketListing[] | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InvitesData>
) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      let invites: BracketListing[] = await db.query(
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
          b.location,
          b.featured,
          m.role
        FROM bracket b
        LEFT JOIN bracket_member m ON m.bracket_id = b.id
        WHERE
          m.member_user_id = $/userId/
          AND m.accepted = false
        ORDER BY m.id DESC;`,
        { userId: session.user.id }
      );

      return res.status(200).json(invites);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not get invites.' });
    }
  }
}
