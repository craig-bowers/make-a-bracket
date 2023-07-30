import type { NextApiRequest, NextApiResponse } from 'next';

import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

type Data = { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
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

      let round = {
        id: req.body?.round?.id,
        modify_user_id: session.user.id,
        bracket_id: req.body?.round?.bracket_id,
        name: req.body?.round?.name,
        timestamp_start: req.body?.round?.timestamp_start,
        timestamp_end: req.body?.round?.timestamp_end,
      };

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
          [session.user.id, round.bracket_id]
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
          UPDATE round
          SET
            modify_timestamp = now(),
            modify_user_id = $/modify_user_id/,
            name = $/name/,
            timestamp_start = $/timestamp_start/,
            timestamp_end = $/timestamp_end/
          WHERE bracket_id = $/bracket_id/
            AND id = $/id/;`,
          {
            id: round.id,
            modify_user_id: round.modify_user_id,
            bracket_id: round.bracket_id,
            name: round.name,
            timestamp_start: round.timestamp_start,
            timestamp_end: round.timestamp_end,
          }
        );
      });

      return res.status(200).json({ message: 'Bracket updated.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating bracket.' });
    }
  }
}
