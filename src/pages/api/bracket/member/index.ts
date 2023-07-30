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
import type { Member } from '../../../../common/types/bracket';
import type { User } from '../../../../common/types/user';
import type { InvitedMember } from '../members/invites/[id]';
interface MemberRequest extends NextApiRequest {
  query: {
    user_id: string | string[] | undefined;
    bracket_id: string | string[] | undefined;
    email: string | string[] | undefined;
    role: string | string[] | undefined;
  };
}
export type MemberInfo = { member_id: Member['id'] } & Pick<
  Member,
  'accepted' | 'role'
> & { user_id: User['id'] } & Pick<
    User,
    'name' | 'email' | 'image' | 'display_name'
  >;

export type MemberData = MemberInfo | InvitedMember | { message: string };

export default async function handler(
  req: MemberRequest,
  res: NextApiResponse<MemberData>
) {
  try {
    let clientIp = '';
    if (typeof req.headers['x-forwarded-for'] === 'string') {
      clientIp = req.headers['x-forwarded-for'].split(',').pop()?.trim() || '';
    } else if (Array.isArray(req.headers['x-forwarded-for'])) {
      clientIp = req.headers['x-forwarded-for'][0];
    }
    if (!clientIp && req.socket?.remoteAddress) {
      clientIp = req.socket.remoteAddress;
    }

    let bracketId = Number(req.query.bracket_id);
    if (isNaN(bracketId) || bracketId === 0)
      return res.status(400).json({ message: 'Not a valid bracket ID.' });
    const session = await getServerSession(req, res, authOptions);
    if (typeof session?.user?.id !== 'string') {
      return res.status(401).json({ message: 'You must be logged in.' });
    }

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

      if (req.method === 'DELETE') {
        if (isNaN(Number(req.query.user_id))) {
          return res.status(400).json({ message: 'Not a valid user ID.' });
        }

        if (req.query.user_id === session.user.id && access.role === 'owner') {
          // Limit deleting yourself as an owner if there is only 1 owner
          const otherOwners = await t.oneOrNone(
            `
            SELECT
              m.member_user_id,
              m.accepted,
              m.role,
              u.email
            FROM bracket_member m
            LEFT JOIN users u
            ON m.member_user_id = u.id
            WHERE bracket_id = $2
              AND member_user_id != $1
              AND accepted = true
              AND role = 'owner'
            LIMIT 1;`,
            [session.user.id, bracketId]
          );
          if (!otherOwners) {
            return res
              .status(400)
              .json({ message: 'Only 1 owner. Unable to delete.' });
          }
        }

        // Don't let admins delete owners
        const memberToChange = await t.oneOrNone(
          `
            SELECT
              m.member_user_id,
              m.accepted,
              m.role,
              u.email
            FROM bracket_member m
            LEFT JOIN users u
            ON m.member_user_id = u.id
            WHERE bracket_id = $2
              AND member_user_id = $1;`,
          [req.query.user_id, bracketId]
        );
        if (access.role === 'admin' && memberToChange.role === 'owner') {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        await t.none(
          `
          DELETE FROM bracket_member_invite
          WHERE bracket_id = $1
            AND email = $2;`,
          [bracketId, memberToChange.email]
        );

        await t.none(
          `
          DELETE FROM bracket_member
          WHERE bracket_id = $1
            AND member_user_id = $2;`,
          [bracketId, req.query.user_id]
        );

        await t.none(
          `
          DELETE FROM bracket_pick
          WHERE bracket_id = $1
            AND user_id = $2;`,
          [bracketId, req.query.user_id]
        );

        await t.none(
          `
          DELETE FROM bracket_vote
          WHERE bracket_id = $1
            AND user_id = $2;`,
          [bracketId, req.query.user_id]
        );

        return res.status(200).json({ message: 'Deleted member.' });
      }

      // This applies to both POST and PUT
      if (access.role === 'admin' && req.query.role === 'owner') {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (req.method === 'POST') {
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

        // Return if bracket doesn't exist
        if (!settings) {
          return res.status(400).json({ message: 'Invalid bracket.' });
        }

        if (userData) {
          const exists = await t.oneOrNone(
            `
            SELECT *
            FROM bracket_member m
            LEFT JOIN users u ON u.id = m.member_user_id
            WHERE m.bracket_id = $1
              AND u.email = $2;`,
            [bracketId, userData.email]
          );
          if (exists) {
            return res.status(400).json({ message: 'Member already exists.' });
          }
        }

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

        const inviteHash = uuidv4();

        // Email invite goes out whether or not the user exists
        let invitedMember: InvitedMember = await t.oneOrNone(
          `
          INSERT INTO bracket_member_invite
          (invite_ip, invite_user_id, bracket_id, role, hash, email)
          VALUES($/invite_ip/, $/invite_user_id/, $/bracket_id/, $/role/, $/hash/, $/email/)
          ON CONFLICT ON CONSTRAINT bracket_member_invite_bracket_id_email_un
          DO
            UPDATE SET
              invite_ip = $/invite_ip/,
              invite_user_id = $/invite_user_id/,
              role = $/role/,
              hash = $/hash/
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
            hash: inviteHash,
            email: req.query.email,
          }
        );

        bracketInvite({
          settings,
          user: userData,
          email: req.query.email,
          hash: inviteHash,
        });

        // If the user exists, add to bracket_member
        // Can be confirmed in user profile or via email
        if (userData) {
          const insertedMember = await t.oneOrNone(
            `
            INSERT INTO bracket_member
            (invite_ip, invite_user_id, member_user_id, bracket_id, role)
            VALUES($/invite_ip/, $/invite_user_id/, $/member_user_id/, $/bracket_id/, $/role/)
            RETURNING id, accepted, role;`,
            {
              invite_ip: clientIp,
              invite_user_id: session.user.id,
              member_user_id: userData.id,
              bracket_id: bracketId,
              role: role,
            }
          );
          return res.status(200).json({
            user_id: userData.id,
            name: userData.name,
            email: userData.email,
            image: userData.image,
            display_name: userData.display_name,
            member_id: insertedMember.id,
            accepted: insertedMember.accepted,
            role: insertedMember.role,
          });
        } else {
          return res.status(200).json(invitedMember);
        }
      }

      if (req.method === 'PUT') {
        if (isNaN(Number(req.query.user_id)))
          return res.status(400).json({ message: 'Not a valid user ID.' });

        if (req.query.user_id === session.user.id && access.role === 'owner') {
          // Limit removing yourself as an owner if there is only 1 owner
          const otherOwners = await t.oneOrNone(
            `
              SELECT
                member_user_id,
                accepted,
                role
              FROM bracket_member
              WHERE bracket_id = $2
                AND member_user_id != $1
                AND accepted = true
                AND role = 'owner'
              LIMIT 1;`,
            [session.user.id, bracketId]
          );
          if (!otherOwners && req.query.role !== 'owner') {
            return res
              .status(400)
              .json({ message: 'Only 1 owner. Unable to delete.' });
          }
        } else {
          // Don't let admins remove ownership
          const memberToChange = await t.oneOrNone(
            `
              SELECT
                member_user_id,
                accepted,
                role
              FROM bracket_member
              WHERE bracket_id = $2
                AND member_user_id = $1;`,
            [req.query.user_id, bracketId]
          );
          if (access.role === 'admin' && memberToChange.role === 'owner') {
            return res.status(401).json({ message: 'Unauthorized' });
          }
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
          WHERE id = $1;`,
          [req.query.user_id]
        );

        if (!userData) {
          return res.status(400).json({ message: 'User not found.' });
        }

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

        const updatedMember = await t.oneOrNone(
          `
          UPDATE bracket_member
          SET role = $/role/
          WHERE member_user_id = $/member_user_id/
            AND bracket_id = $/bracket_id/
          RETURNING id, accepted, role;`,
          {
            member_user_id: userData.id,
            bracket_id: bracketId,
            role: role,
          }
        );

        return res.status(200).json({
          user_id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          display_name: userData.display_name,
          member_id: updatedMember.id,
          accepted: updatedMember.accepted,
          role: updatedMember.role,
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not get members.' });
  }
}
