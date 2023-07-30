import { getDB, sql } from '../../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
interface InvitedMembersRequest extends NextApiRequest {
  query: { id: string | string[] | undefined };
}

import type { Member } from '../../../../../common/types/bracket';
export type InvitedMember = Pick<
  Member,
  'id' | 'invite_timestamp' | 'invite_user_id' | 'bracket_id' | 'role'
> & {
  expire_timestamp: Date | string;
  email: string;
};

export type InvitedMembersData = InvitedMember[] | { message: string };

export default async function handler(
  req: InvitedMembersRequest,
  res: NextApiResponse<InvitedMembersData>
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

        const members = await t.any(
          `
          SELECT
            id,
            invite_timestamp,
            invite_user_id,
            bracket_id,
            role,
            expire_timestamp,
            email
          FROM bracket_member_invite
          WHERE bracket_id = $1;`,
          [bracketId]
        );

        return res.status(200).json(members);
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: 'Could not get invited members.' });
    }
  }
}
