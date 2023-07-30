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
  if (req.method === 'PUT') {
    try {
      let bracketId = Number(req.query.id);
      if (isNaN(bracketId) || bracketId === 0)
        return res.status(400).json({ message: 'Not a valid bracket ID.' });

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

      await db.task(async (t) => {
        await db.none(
          `
          UPDATE bracket_member
          SET
            member_ip = $/ip/,
            member_timestamp = now(),
            accepted = true
          WHERE member_user_id = $/userId/
            AND bracket_id = $/bracket_id/;`,
          { ip: clientIp, userId: session.user.id, bracket_id: bracketId }
        );

        await db.none(
          `
          DELETE FROM bracket_member_invite
          WHERE bracket_id = $/bracket_id/
            AND email = $/email/;`,
          { bracket_id: bracketId, email: session.user.email }
        );

        return res.status(200).json({ message: 'Invite accepted.' });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not accept invite.' });
    }
  }
}
