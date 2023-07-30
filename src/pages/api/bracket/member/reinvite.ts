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
import type { InvitedMember } from '../members/invites/[id]';
interface ReinviteRequest extends NextApiRequest {
  query: {
    bracket_id: string | string[] | undefined;
    email: string | string[] | undefined;
    role: string | string[] | undefined;
  };
}

export type ReinviteData = InvitedMember | { message: string };

export default async function handler(
  req: ReinviteRequest,
  res: NextApiResponse<ReinviteData>
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
      }

      let bracketId = Number(req.query.bracket_id);
      if (isNaN(bracketId) || bracketId === 0)
        return res.status(400).json({ message: 'Not a valid bracket ID.' });

      const newHash = uuidv4();

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
          [session.user.id, bracketId]
        );

        if (!access) {
          return res.status(401).json({ message: 'Unauthorized' });
        } else if (access.accepted === false) {
          return res
            .status(401)
            .json({ message: 'Please accept your bracket invite.' });
        }

        if (
          typeof req.query.email !== 'string' ||
          !EMAIL_REGEX.test(req.query.email)
        ) {
          return res.status(400).json({ message: 'Invalid email.' });
        }

        const userData = await t.oneOrNone(
          `
          SELECT
            id,
            name,
            email,
            image,
            display_name
          FROM users
          WHERE email = $1;`,
          [req.query.email]
        );

        const settings = await t.oneOrNone(
          `
          SELECT *
          FROM bracket
          WHERE id = $1;`,
          [bracketId]
        );

        let role = null;
        if (typeof req.query.role === 'string') {
          switch (req.query.role.toLowerCase()) {
            case 'owner':
              role = 'owner';
              break;
            case 'admin':
              role = 'admin';
              break;
            default:
              role = null;
              break;
          }
        }

        let invitedMember: InvitedMember = await t.oneOrNone(
          `
          UPDATE bracket_member_invite
          SET
            invite_ip = $/invite_ip/,
            invite_user_id = $/invite_user_id/,
            role = $/role/,
            hash = $/hash/,
            expire_timestamp = now() + INTERVAL '7 days'
          WHERE bracket_id = $/bracket_id/
            AND email = $/email/
          RETURNING
            id,
            invite_timestamp,
            invite_user_id,
            bracket_id,
            role,
            expire_timestamp,
            email;`,
          {
            invite_ip: clientIp,
            invite_user_id: session.user.id,
            bracket_id: bracketId,
            role: role,
            hash: newHash,
            email: req.query.email,
          }
        );

        // let invitedMember: InvitedMember = await t.oneOrNone(
        //   `
        //   INSERT INTO bracket_member_invite
        //   (invite_ip, invite_user_id, bracket_id, role, hash, email)
        //   VALUES($/invite_ip/, $/invite_user_id/, $/bracket_id/, $/role/, $/hash/, $/email/)
        //   ON CONFLICT ON CONSTRAINT bracket_member_invite_bracket_id_email_un
        //   DO
        //     UPDATE SET
        //       invite_ip = $/invite_ip/,
        //       invite_user_id = $/invite_user_id/,
        //       role = $/role/,
        //       hash = $/hash/
        //   RETURNING
        //     id,
        //     invite_timestamp,
        //     invite_user_id,
        //     bracket_id,
        //     role,
        //     expire_timestamp,
        //     email;`,
        //   {
        //     invite_ip: clientIp,
        //     invite_user_id: session.user.id,
        //     bracket_id: bracketId,
        //     role: role,
        //     hash: newHash,
        //     email: req.query.email,
        //   }
        // );

        if (!invitedMember) {
          return res.status(400).json({ message: 'Could not invite member.' });
        }

        bracketInvite({
          settings,
          user: userData,
          email: req.query.email,
          hash: newHash,
        });

        return res.status(200).json(invitedMember);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not invite member.' });
    }
  }
}
