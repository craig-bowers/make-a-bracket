import { getDB } from '../../../common/utils/pgp';
const { db, pgp } = getDB();
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BracketListing, Category } from '../../../common/types/bracket';
interface BracketListingsRequest extends NextApiRequest {
  query: {
    catId: string | string[] | undefined;
    timestamp: string | undefined;
    limit: string | undefined;
    offset: string | undefined;
  };
}
type Data =
  | {
      brackets: BracketListing[];
      canLoadMore: boolean;
    }
  | { message: string };

export default async function handler(
  req: BracketListingsRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);

      let catIds: number[] = [];

      if (Array.isArray(req.query.catId)) {
        // req.query.catId is an array if there are multiple ids e.g. ?catId=1&catId=2
        for (let category of req.query.catId) {
          let catId = Number(category);
          if (isNaN(catId)) continue;
          else catIds.push(catId);
        }
      } else if (typeof req.query.catId === 'string') {
        // if only one catId is included in the search query it will be a string
        catIds.push(Number(req.query.catId));
      }

      let defaultLimit = 20;

      let timestamp = req.query.timestamp
        ? new Date(Number(req.query.timestamp))
        : new Date();
      let offset = req.query.offset ? parseInt(req.query.offset) : undefined;
      let limit = req.query.limit ? parseInt(req.query.limit) : defaultLimit;
      if (limit > 100)
        return res.status(400).json({ message: 'Over limit (100)' });

      let catIdsSql =
        catIds.length > 0
          ? pgp.as.format('AND c.category_id IN ($/catIds:csv/)', {
              catIds: catIds,
            })
          : '';

      let someBrackets: BracketListing[] = await db.query(
        `
        SELECT
          DISTINCT b.id,
          b.published,
          b.publish_timestamp,
          b.create_timestamp,
          b.create_user_id,
          b.modify_timestamp,
          b.modify_user_id,
          b.bracket_type,
          b.name,
          b.slug,
          b.image,
          b.description,
          b.rules,
          b.visibility,
          b.restricted,
          b.featured AS bracket_featured,
          c.featured AS category_featured,
          m.role
        FROM bracket b
        LEFT JOIN bracket_member m
        ON m.bracket_id = b.id
        LEFT JOIN bracket_category c
        ON b.id = c.bracket_id
        WHERE b.published = true
          AND ((b.publish_timestamp IS NULL) OR (now() > b.publish_timestamp))
          AND ((b.visibility = true) OR ((m.member_user_id IS NOT NULL) AND (m.member_user_id = $/userId/) AND (m.accepted = true)))
          AND b.create_timestamp < $/timestamp/
          ${catIdsSql}
        ORDER BY b.featured ASC, c.featured ASC, b.id DESC
        LIMIT $/limit/
        OFFSET $/offset/;`,
        {
          userId: session?.user?.id,
          timestamp: pgp.as.date(timestamp),
          offset: offset,
          limit: limit,
        }
      );

      return res.status(200).json({
        brackets: someBrackets,
        canLoadMore: (limit || defaultLimit) <= someBrackets.length,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Could not get brackets.' });
    }
  }
}
