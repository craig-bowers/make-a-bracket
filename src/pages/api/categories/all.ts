import { getDB } from '../../../common/utils/pgp';
const { db, pgp } = getDB();

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Category } from '../../../common/types/bracket';
type Data = Category[] | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    try {
      let categories: Category[] = await db.query(
        `
        WITH RECURSIVE category_path (id, parent_id, create_timestamp, create_user_id, modify_timestamp, modify_user_id, active, featured, name, slug, path, image, description) AS (
          SELECT id, parent_id, create_timestamp, create_user_id, modify_timestamp, modify_user_id, active, featured, name, slug, '/brackets/categories/' || slug as path, image, description
          FROM category
          WHERE parent_id IS NULL
        UNION ALL
          SELECT c.id, c.parent_id, c.create_timestamp, c.create_user_id, c.modify_timestamp, c.modify_user_id, c.active, c.featured, c.name, c.slug, CONCAT(cp.path, '/', c.slug), c.image, c.description
          FROM category_path cp
          JOIN category c
            ON cp.id = c.parent_id
        )
        SELECT * FROM category_path
        WHERE active = true
        ORDER BY path`
      );

      return res.status(200).json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Could not get categories.' });
    }
  }
}
