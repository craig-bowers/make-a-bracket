import { getDB } from '../../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';

export type InviteResponseData = { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InviteResponseData>
) {
  if (req.method === 'DELETE') {
    let bracketId = Number(req.query.id);
    if (isNaN(bracketId) || bracketId === 0)
      return res.status(400).json({ message: 'Not a valid bracket ID.' });
    try {
      const session = await getServerSession(req, res, authOptions);
      if (typeof session?.user?.id !== 'string') {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      await db.none(
        `
        DELETE FROM bracket_member
        WHERE member_user_id = $/userId/
          AND bracket_id = $/bracket_id/;`,
        { userId: session.user.id, bracket_id: bracketId }
      );

      return res.status(200).json({ message: 'Invite rejected.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not reject invite.' });
    }
  }
}
