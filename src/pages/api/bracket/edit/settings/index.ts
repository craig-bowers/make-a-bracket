// Database
import { getDB, sql } from '../../../../../common/utils/pgp';
const { db, pgp } = getDB();
// Auth.js
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  Settings,
  Category,
  BracketCategory as BracketCategoryProps,
} from '../../../../../common/types/bracket';
interface EditBracketSettingsRequest extends NextApiRequest {
  body: { settings: Settings; categories: Category[] };
}
type Data = { message: string };
type UpdateSettings = Omit<
  Settings,
  'bracket_type' | 'create_timestamp' | 'create_user_id' | 'modify_timestamp'
>;

export default async function handler(
  req: EditBracketSettingsRequest,
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

      if (!req.body?.settings?.slug) {
        return res.status(400).json({ message: 'Missing slug.' });
      }

      const reqBracket = req?.body?.settings;

      let bracket: UpdateSettings = {
        id: reqBracket?.id,
        published: reqBracket?.published,
        publish_timestamp: reqBracket?.publish_timestamp,
        modify_user_id: session.user.id,
        name: reqBracket?.name,
        slug: reqBracket?.slug,
        image: reqBracket?.image,
        description: reqBracket?.description,
        rules: reqBracket?.rules,
        visibility: reqBracket?.visibility,
        restricted: reqBracket?.restricted,
        location: reqBracket?.location,
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
          [session.user.id, bracket.id]
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
          UPDATE bracket
          SET
            published = $/published/,
            publish_timestamp = $/publish_timestamp/,
            modify_timestamp = now(),
            modify_user_id = $/modify_user_id/,
            name = $/name/,
            slug = $/slug/,
            image = $/image/,
            description = $/description/,
            rules = $/rules/,
            visibility = $/visibility/,
            restricted = $/restricted/,
            location = $/location/
          WHERE id = $/id/;`,
          bracket
        );

        // Will look like the category table
        const newCategories = req?.body?.categories;

        // Will look like the bracket_category table
        const originalCategories: BracketCategoryProps[] = await t.manyOrNone(
          `
          SELECT *
          FROM bracket_category
          WHERE bracket_id = $1;`,
          [bracket.id]
        );

        const categoriesToDelete: number[] = [];
        // Search for cats not included in the new set of categories
        for (let ogCat of originalCategories) {
          if (
            newCategories.findIndex(
              (newCat: { id: number }) => newCat.id === ogCat.category_id
            ) === -1
          ) {
            categoriesToDelete.push(ogCat.category_id);
          }
        }

        if (categoriesToDelete.length > 0) {
          await t.none(
            `
            DELETE FROM bracket_category
            WHERE bracket_id = $1
              AND category_id IN ($2:csv);`,
            [bracket.id, categoriesToDelete]
          );
        }

        // Search for new cats not included in original categories
        const categoriesToAdd: Pick<
          BracketCategoryProps,
          'bracket_id' | 'category_id'
        >[] = [];
        for (let newCat of newCategories) {
          if (
            originalCategories.findIndex(
              (ogCat: { category_id: number }) =>
                ogCat.category_id === newCat.id
            ) === -1
          ) {
            categoriesToAdd.push({
              bracket_id: bracket.id,
              category_id: newCat.id,
            });
          }
        }

        if (categoriesToAdd.length > 0) {
          const categoriesCs = new pgp.helpers.ColumnSet(
            ['bracket_id', 'category_id'],
            {
              table: 'bracket_category',
            }
          );

          const categoriesInsert = pgp.helpers.insert(
            categoriesToAdd,
            categoriesCs
          );

          await t.none(categoriesInsert);
        }
      });

      return res.status(200).json({ message: 'Bracket updated.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating bracket.' });
    }
  }
}
