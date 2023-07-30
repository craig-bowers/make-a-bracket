import { getDB, sql } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import { Participant } from '../../../../common/types/bracket';
interface EditParticipantRequest extends NextApiRequest {
  body: { participant: Participant };
}
type Data = { message: string };

export default async function handler(
  req: EditParticipantRequest,
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

      let participant = {
        id: req.body?.participant?.id,
        modify_user_id: session.user.id,
        bracket_id: req.body?.participant?.bracket_id,
        name: req.body?.participant?.name,
        ranking: req.body?.participant?.ranking,
        image: req.body?.participant?.image,
        email: req.body?.participant?.email,
        website: req.body?.participant?.website,
        video: req.body?.participant?.video,
        details: req.body?.participant?.details,
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
          [session.user.id, participant.bracket_id]
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
          UPDATE participant
          SET
            modify_timestamp = now(),
            modify_user_id = $/modify_user_id/,
            name = $/name/,
            ranking = $/ranking/,
            image = $/image/,
            email = $/email/,
            website = $/website/,
            video = $/video/,
            details = $/details/
          WHERE bracket_id = $/bracket_id/
            AND id = $/id/;`,
          participant
        );
      });

      return res.status(200).json({ message: 'Participant updated.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating participants.' });
    }
  }
}
