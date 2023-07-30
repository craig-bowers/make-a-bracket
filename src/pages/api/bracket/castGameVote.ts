import { getDB, sql } from '../../../common/utils/pgp';
const { db, pgp } = getDB();

import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
// Types
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserVote as UserVoteProps } from '../../../common/types/bracket';

export type CastGameVote = UserVoteProps | { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CastGameVote>
) {
  try {
    let clientIp = '';
    if (typeof req.headers['x-forwarded-for'] === 'string') {
      clientIp = req.headers['x-forwarded-for'].split(',').pop()?.trim() || '';
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

    let bracket_id = Number(req.query.bracket_id);
    if (Number.isInteger(bracket_id) === false) {
      return res.status(400).json({ message: 'Invalid bracket ID.' });
    }
    let game_key = String(req.query.game_key);
    if (typeof game_key !== 'string' || game_key.length === 0) {
      return res.status(400).json({ message: 'Invalid game key.' });
    }
    let participant_key = String(req.query.participant_key);
    if (typeof participant_key !== 'string' || participant_key.length === 0) {
      return res.status(400).json({ message: 'Invalid participant key.' });
    }

    let checks = await db.oneOrNone(
      `
      SELECT
        bracket.published,
        bracket.publish_timestamp,
        round.timestamp_start AS round_timestamp_start,
        round.timestamp_end AS round_timestamp_end,
        game.winner AS game_winner,
        game.time AS game_time
      FROM bracket
      LEFT JOIN round
      ON round.bracket_id = bracket.id
      LEFT JOIN game ON game.round_id = round.id
      WHERE game.key = $1;`,
      [game_key]
    );

    // Checks game winner & game time; round start & end voting times
    if (checks.game_winner !== null && checks.game_winner !== '') {
      return res.status(400).json({ message: 'Winner has been declared.' });
    } else if (new Date() < checks.round_timestamp_start) {
      return res.status(400).json({ message: 'Voting has not started.' });
    } else if (
      checks.round_timestamp_end &&
      new Date() > checks.round_timestamp_end
    ) {
      return res.status(400).json({ message: 'Voting has ended.' });
    } else if (checks.game_time && new Date() > new Date(checks.game_time)) {
      return res.status(400).json({ message: 'Game has already started.' });
    } else if (
      checks.published === false ||
      (checks.publish_timestamp &&
        new Date(checks.publish_timestamp) > new Date())
    ) {
      return res
        .status(400)
        .json({ message: 'Error finding published bracket.' });
    }

    if (req.method === 'PUT') {
      let vote: UserVoteProps | null = await db.oneOrNone(
        `
          INSERT INTO bracket_vote
          (ip, user_id, bracket_id, game_key, participant_key)
          VALUES ($/ip/, $/userId/, $/bracketId/, $/gameKey/, $/participantKey/)
          ON CONFLICT ON CONSTRAINT bracket_vote_user_id_bracket_id_game_key_un
          DO
            UPDATE SET participant_key = $/participantKey/
          RETURNING id, timestamp, user_id, bracket_id, game_key, participant_key;`,
        {
          ip: clientIp,
          userId: session.user.id,
          bracketId: bracket_id,
          gameKey: game_key,
          participantKey: participant_key,
        }
      );
      // let vote = await db.oneOrNone(
      //   `
      //   UPDATE bracket_vote
      //   SET
      //     ip = $/ip/,
      //     participant_key = $/participantKey/
      //   WHERE user_id = $/userId/
      //     AND bracket_id = $/bracketId/
      //     AND game_key = $/gameKey/
      //   RETURNING id, timestamp, user_id, bracket_id, game_key, participant_key;`,
      //   {
      //     ip: clientIp,
      //     userId: session.user.id,
      //     bracketId: bracket_id,
      //     gameKey: game_key,
      //     participantKey: participant_key,
      //   }
      // );
      if (vote === null) {
        return res.status(500).json({ message: 'Vote error.' });
      }
      return res.status(200).json(vote);
    } else if (req.method === 'DELETE') {
      await db.none(
        `
          DELETE FROM bracket_vote
          WHERE user_id = $/userId/
            AND bracket_id = $/bracketId/
            AND game_key = $/gameKey/;`,
        {
          userId: session.user.id,
          bracketId: bracket_id,
          gameKey: game_key,
        }
      );
      return res.status(200).json({ message: 'Removed vote.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Vote error.' });
  }
}
