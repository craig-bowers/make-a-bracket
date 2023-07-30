import { getDB } from '../../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import { User as UserProps } from '../../../../common/types/user';
type UpdateUser = Pick<UserProps, 'name' | 'display_name' | 'image'>;
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

      await db.none(
        `
        UPDATE users
        SET
          name = $/name/,
          display_name = $/display_name/,
          image = $/image/
        WHERE id = $/id/;`,
        {
          name: req.body.name,
          display_name: req.body.display_name,
          image: req.body.image,
          id: session.user.id,
        }
      );

      return res.status(200).json({ message: 'User updated.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not update user.' });
    }
  }
}
