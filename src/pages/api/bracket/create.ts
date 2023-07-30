import { getDB } from '../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  NewBracket,
  NewSettings,
  NewParticipant,
  NewRound,
  NewGame,
  NewMember,
  Category,
} from '../../../common/types/bracket';

type CreateSettings = NewSettings & {
  ip: string;
  create_user_id: string;
};
type CreateParticipant = NewParticipant & {
  ip: string;
  create_user_id: string;
  bracket_id: number;
};
type CreateRound = Omit<NewRound, 'games'> & {
  ip: string;
  create_user_id: string;
  bracket_id: number;
};
type CreateGame = NewGame & {
  ip: string;
  create_user_id: string;
  bracket_id: number;
  round_id: number;
};
type CreateMember = NewMember & {
  invite_ip: string;
  invite_user_id: string;
  member_ip: string;
  member_timestamp: string;
  accepted: boolean;
};
interface CreateBracketRequest extends NextApiRequest {
  body: NewBracket;
}
type Data = {
  message: string;
  slug?: string;
  id?: number;
};

export default async function handler(
  req: CreateBracketRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
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

      let bracket: CreateSettings = {
        ip: clientIp,
        published: req.body?.settings?.published,
        publish_timestamp: req.body?.settings?.publish_timestamp,
        create_user_id: session.user.id,
        bracket_type: req.body?.settings?.bracket_type,
        name: req.body?.settings?.name,
        slug: req.body?.settings?.slug
          .replace(/[^A-Za-z0-9_-\s]/g, '')
          .trim()
          .replace(/\W+/g, '-')
          .toLowerCase(),
        image: req.body?.settings?.image.trim(),
        description: req.body?.settings?.description,
        rules: req.body?.settings?.rules,
        visibility: req.body?.settings?.visibility,
        restricted: req.body?.settings?.restricted,
        location: req.body?.settings?.location,
      };

      const bracketCs = new pgp.helpers.ColumnSet(
        [
          'ip',
          'published',
          'publish_timestamp',
          'create_user_id',
          'bracket_type',
          'name',
          'slug',
          'image',
          'description',
          'rules',
          'visibility',
          'restricted',
          'location',
        ],
        { table: 'bracket' }
      );

      const bracketInsert =
        pgp.helpers.insert(bracket, bracketCs) + ' RETURNING id, slug';

      await db.task(async (t) => {
        let { id: bracket_id, slug }: { id: number; slug: string } =
          await t.one(bracketInsert);
        if (typeof session?.user?.id !== 'string') {
          return res.status(401).json({ message: 'You must be logged in.' });
        }

        let member: CreateMember = {
          invite_ip: clientIp,
          invite_user_id: session.user.id,
          member_ip: clientIp,
          member_timestamp: 'now()',
          member_user_id: session.user.id,
          accepted: true,
          bracket_id: bracket_id,
          role: 'owner',
        };

        await t.none(
          `
          INSERT INTO bracket_member (
            invite_ip,
            invite_user_id,
            member_ip,
            member_timestamp,
            member_user_id,
            accepted,
            bracket_id,
            role
          ) VALUES (
            $/invite_ip/,
            $/invite_user_id/,
            $/member_ip/,
            $/member_timestamp/,
            $/member_user_id/,
            $/accepted/,
            $/bracket_id/,
            $/role/
          )`,
          member
        );

        if (req.body?.categories?.length > 0) {
          let categories = req.body.categories.map(
            (c: Pick<Category, 'id'>) => {
              let category = {
                bracket_id: bracket_id,
                category_id: c.id,
              };
              return category;
            }
          );

          const categoriesCs = new pgp.helpers.ColumnSet(
            ['bracket_id', 'category_id'],
            {
              table: 'bracket_category',
            }
          );

          const categoriesInsert = pgp.helpers.insert(categories, categoriesCs);

          await t.none(categoriesInsert);
        }

        let participants: CreateParticipant[] = req.body.participants.map(
          (p: NewParticipant) => {
            if (typeof session?.user?.id !== 'string') {
              throw new Error('You must be logged in.');
            }
            let participant = {
              // Must add bracket_id before db insert
              ip: clientIp,
              create_user_id: session.user.id,
              bracket_id: bracket_id,
              key: p.key,
              name: p.name,
              ranking: p.ranking,
              image: p.image,
              email: p.email,
              website: p.website,
              video: p.video,
              details: p.details,
            };
            return participant;
          }
        );

        const participantsCs = new pgp.helpers.ColumnSet(
          [
            'ip',
            'create_user_id',
            'bracket_id',
            'key',
            'name',
            'ranking',
            'image',
            'email',
            'website',
            'video',
            'details',
          ],
          { table: 'participant' }
        );

        const participantsInsert = pgp.helpers.insert(
          participants,
          participantsCs
        );

        await t.none(participantsInsert);

        let rounds = req.body.rounds.map((r: NewRound): CreateRound => {
          if (typeof session?.user?.id !== 'string') {
            throw new Error('Session error.');
          }
          let round = {
            ip: clientIp,
            create_user_id: session.user.id,
            bracket_id: bracket_id,
            key: r.key,
            number: r.number,
            name: r.name,
            timestamp_start: r.timestamp_start,
            timestamp_end: r.timestamp_end,
            ppg: r.ppg || 1,
          };
          return round;
        });

        const roundsCs = new pgp.helpers.ColumnSet(
          [
            'ip',
            'create_user_id',
            'bracket_id',
            'key',
            'number',
            'name',
            'timestamp_start',
            'timestamp_end',
            'ppg',
          ],
          { table: 'round' }
        );

        const roundsInsert =
          pgp.helpers.insert(rounds, roundsCs) + ' RETURNING id';

        let roundIdArray = await t.many(roundsInsert);

        let games: CreateGame[] = [];
        for (let [rIndex, r] of req.body.rounds.entries()) {
          for (let game of r.games) {
            games.push({
              ip: clientIp,
              create_user_id: session.user.id,
              bracket_id: bracket_id,
              round_id: roundIdArray[rIndex].id,
              key: game.key,
              number: game.number,
              name: game.name,
              player_1: game.player_1,
              player_2: game.player_2,
              winner: game.winner,
              player_1_score: game.player_1_score,
              player_2_score: game.player_2_score,
              time: game.time,
              location: game.location,
              details: game.details,
            });
          }
        }
        // Removed forEach to make sure it's sequential but keeping this for a temporary backup
        // req.body.rounds.forEach((r, rIndex) => {
        //   r.games.forEach((game) => {
        //     games.push({
        //       ip: clientIp,
        //       create_user_id: session.user.id,
        //       bracket_id: bracket_id,
        //       round_id: roundIdArray[rIndex].id,
        //       key: game.key,
        //       number: game.number,
        //       name: game.name,
        //       player_1: game.player_1,
        //       player_2: game.player_2,
        //       winner: game.winner,
        //       player_1_score: game.player_1_score,
        //       player_2_score: game.player_2_score,
        //       time: game.time,
        //       location: game.location,
        //       details: game.details,
        //     });
        //   });
        // });

        const gamesCs = new pgp.helpers.ColumnSet(
          [
            'ip',
            'create_user_id',
            'bracket_id',
            'round_id',
            'key',
            'number',
            'name',
            'player_1',
            'player_2',
            'winner',
            'player_1_score',
            'player_2_score',
            'time',
            'location',
            'details',
          ],
          { table: 'game' }
        );

        let gamesInsert = pgp.helpers.insert(games, gamesCs);

        await t.none(gamesInsert);

        return res.status(200).json({
          message: 'Success',
          slug: slug,
          id: bracket_id,
        });
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Could not create bracket.' });
    }
  }
}
