import { getDB } from '../../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

import { validate as uuidValidate } from 'uuid';

// Types
import type { Member, Settings } from '../../../../../common/types/bracket';
import type { NextApiRequest, NextApiResponse } from 'next';

export type HashInviteData = Settings | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HashInviteData>
) {
  if (req.method === 'GET') {
    try {
      if (typeof req.query.hash !== 'string' || !uuidValidate(req.query.hash))
        return res.status(400).json({ message: 'Not a valid link.' });

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

      await db.task(async (t) => {
        const session = await getServerSession(req, res, authOptions);
        if (typeof session?.user?.id !== 'string') {
          return res.status(401).json({ message: 'You must be logged in.' });
        }

        let member: Member = await t.oneOrNone(
          `
          INSERT INTO bracket_member (
            invite_ip,
            invite_timestamp,
            invite_user_id,
            member_ip,
            member_timestamp,
            member_user_id,
            accepted,
            bracket_id,
            role
          )
          SELECT
            invite_ip,
            invite_timestamp,
            invite_user_id,
            $/clientIp/,
            now(),
            $/userId/,
            true,
            bracket_id,
            role
          FROM bracket_member_invite
          WHERE hash = $/hash/
          ON CONFLICT ON CONSTRAINT bracket_member_bracket_id_member_user_id_un
          DO UPDATE SET accepted = true
          RETURNING
            id,
            invite_timestamp,
            invite_user_id,
            member_timestamp,
            member_user_id,
            accepted,
            bracket_id,
            role;`,
          { clientIp: clientIp, userId: session.user.id, hash: req.query.hash }
        );

        await db.none(
          `
          DELETE FROM bracket_member_invite
          WHERE hash = $/hash/;`,
          { hash: req.query.hash }
        );

        if (member === null) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        let bracket: Settings = await t.oneOrNone(
          `
          SELECT *
          FROM bracket
          WHERE id = $/bracket_id/;`,
          { bracket_id: member.bracket_id }
        );
        delete bracket.ip;

        return res.status(200).json(bracket);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not accept invite.' });
    }
  }
}
