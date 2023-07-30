import pgPromise from 'pg-promise';
import { singleElimination } from './singleElimination';
import { singleEliminationVoting } from './singleEliminationVoting';

import type {
  Settings,
  Participant,
  Round,
  Game,
  Member,
  Category,
  Bracket,
} from '../../../../../types/bracket';
export type BracketData = Promise<
  | Bracket
  | {
      error: {
        code: number;
        message: string;
      };
    }
>;

export async function getBracket(
  db: pgPromise.IDatabase<any>,
  bracketId: number,
  userId?: string
): BracketData {
  try {
    let settings: Settings = await db.one(
      `
      SELECT *
      FROM bracket
      WHERE id = $1;`,
      [bracketId]
    );

    if (settings) delete settings.ip;

    let member: Member | null = null;

    if (userId) {
      member = userId
        ? await db.oneOrNone(
            `
            SELECT *
            FROM bracket_member
            WHERE bracket_id = $1
              AND member_user_id = $2;`,
            [bracketId, userId]
          )
        : null;
    }

    if (member !== null) {
      delete member.invite_ip;
      delete member.member_ip;
    }

    if (settings.restricted === true) {
      if (!member || member.accepted === false)
        return {
          error: {
            code: 401,
            message: 'This bracket is restricted.',
          },
        };
    }

    let participants: Participant[] = await db.many(
      `
      SELECT *
      FROM participant
      WHERE bracket_id = $1
      ORDER BY id;`,
      [bracketId]
    );

    participants.forEach((participant) => {
      delete participant.ip;
    });

    let roundsOnly = await db.query(
      `
      SELECT *
      FROM round
      WHERE bracket_id = $1
      ORDER BY number;`,
      [bracketId]
    );

    let gamesOnly = await db.query(
      `
      SELECT *
      FROM game
      WHERE bracket_id = $1
      ORDER BY number;`,
      [bracketId]
    );

    // Remove ip info from games
    gamesOnly.forEach((game: Game) => {
      delete game.ip;
    });

    // Remove ip info from rounds and add games to rounds
    let rounds: Round[] = roundsOnly.map((r: Round) => {
      let round = { ...r };
      delete round.ip;
      round.games = gamesOnly.filter(
        (game: Game) => game.round_id === round.id
      );
      return round;
    });

    const categories: Category[] = await db.manyOrNone(
      `
      SELECT category.*,
        '/brackets/categories/' || category.slug AS path
      FROM bracket_category
      LEFT JOIN category
      ON bracket_category.category_id = category.id
      WHERE bracket_category.bracket_id = $1;`,
      [bracketId]
    );

    // Remove ip info from categories
    categories.forEach((category) => {
      delete category.create_ip;
      delete category.modify_ip;
    });

    let bracket: Bracket = {
      settings,
      participants,
      rounds,
      member,
      categories,
    };

    switch (bracket.settings.bracket_type) {
      case 'single-elimination':
        if (userId) {
          bracket = await singleElimination(db, bracket, userId); // get user picks
        }
        break;
      case 'single-elimination-voting':
        bracket = await singleEliminationVoting(db, bracket, userId); // update winners & get votes
      default:
        break;
    }

    return bracket;
  } catch (err) {
    console.error(err);
    return {
      error: {
        code: 404,
        message: 'Could not get bracket.',
      },
    };
  }
}
