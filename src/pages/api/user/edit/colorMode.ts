import { getDB } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import { User as UserProps } from '../../../../common/types/user';
type UpdateUser = Pick<UserProps, 'color_mode'>;
interface EditProfileRequest extends NextApiRequest {
  body: UpdateUser;
}
type Data = { message: string };

export default async function handler(
  req: EditProfileRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ message: 'You must be logged in.' });
      }

      if (
        !(
          req.body.color_mode === null ||
          req.body.color_mode?.toLowerCase() === 'light' ||
          req.body.color_mode?.toLowerCase() === 'dark'
        )
      ) {
        return res.status(400).json({ message: 'Invalid color mode.' });
      }

      const color_mode =
        req.body.color_mode === null
          ? null
          : req.body.color_mode?.toLowerCase();

      await db.none(
        `
            UPDATE users
            SET color_mode = $/color_mode/
            WHERE id = $/id/;`,
        {
          color_mode: color_mode,
          id: session.user.id,
        }
      );

      return res.status(200).json({ message: 'Color mode updated.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not color mode.' });
    }
  }
}
