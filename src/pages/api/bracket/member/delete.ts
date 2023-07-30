import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Email
import bracketInvite from '../../../../common/utils/sendgrid/bracketInvite';
// UUID
import { v4 as uuidv4 } from 'uuid';

import { EMAIL_REGEX } from '../../../../common/regExp';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
interface DeleteInviteRequest extends NextApiRequest {
  query: {
    bracket_id: string | string[] | undefined;
    email: string | string[] | undefined;
  };
}

export type DeleteInviteData = { message: string };

export default async function handler(
  req: DeleteInviteRequest,
  res: NextApiResponse<DeleteInviteData>
) {
  if (req.method === 'DELETE') {
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

      let bracketId = Number(req.query.bracket_id);
      if (isNaN(bracketId) || bracketId === 0)
        return res.status(400).json({ message: 'Not a valid bracket ID.' });

      await db.task(async (t) => {
        if (
          typeof req.query.email !== 'string' ||
          !EMAIL_REGEX.test(req.query.email)
        ) {
          return res.status(400).json({ message: 'Invalid email.' });
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

        await t.none(
          `
          DELETE FROM bracket_member_invite
          WHERE bracket_id = $/bracket_id/
            AND email = $/email/;`,
          { bracket_id: bracketId, email: req.query.email }
        );
        return res.status(200).json({ message: 'Deleted invite.' });
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Could not invite member.' });
    }
  }
}
