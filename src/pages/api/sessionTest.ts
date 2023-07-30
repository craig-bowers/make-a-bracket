// https://next-auth.js.org/configuration/nextjs

import { authOptions } from './auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
type Data = { message: string; session?: Session };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  return res.status(200).json({
    message: 'Success',
    session: session,
  });
}
