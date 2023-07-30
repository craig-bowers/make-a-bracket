import type { Adapter } from 'next-auth/adapters';
import type pgPromise from 'pg-promise';

/**
 * Convert the value of expires_at in an object to be a number.
 * It is stored as a BIGINT in the Postgres schema but it appears to be converted
 * to a string by the `pg` adapter.
 *
 * @param account Account object. Account is not exported from `next-auth/adapters` like
 * other types are.
 * @returns Account object with all keys/values identical but the account value.
 */

export function mapExpiresAt(account: any) {
  const expires_at = parseInt(account.expires_at);
  return {
    ...account,
    expires_at,
  };
}

export function PostgresAdapter(db: pgPromise.IDatabase<any>): Adapter {
  return {
    async createVerificationToken(verificationToken) {
      try {
        const { identifier, expires, token } = verificationToken;
        await db.none(
          `
          INSERT INTO verification_token
          (identifier, expires, token)
          VALUES ($/identifier/, $/expires/, $/token/);`,
          {
            identifier: identifier,
            expires: expires,
            token: token,
          }
        );
        return verificationToken;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async useVerificationToken({ identifier, token }) {
      try {
        let deleted = await db.oneOrNone(
          `
          DELETE FROM verification_token
          WHERE identifier = $1 and token = $2
          RETURNING identifier, expires, token;`,
          [identifier, token]
        );
        return deleted;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async createUser(user) {
      try {
        let newUser = await db.one(
          `
          INSERT INTO users
          (name, email, email_verified, image, display_name)
          VALUES ($/name/, $/email/, $/emailVerified/, $/image/, $/name/)
          RETURNING id, name, email, email_verified, image;`,
          {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
          }
        );
        return newUser;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async getUser(id) {
      try {
        let user = await db.oneOrNone(
          `
          SELECT *
          FROM users
          WHERE id = $1;`,
          [id]
        );
        return user;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async getUserByEmail(email) {
      try {
        let user = await db.oneOrNone(
          `
          SELECT *
          FROM users
          WHERE email = $1;`,
          [email]
        );
        return user;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async getUserByAccount({ providerAccountId, provider }) {
      try {
        let user = await db.oneOrNone(
          `
          SELECT users.*
          FROM users
          JOIN account ON users.id = account.user_id
          WHERE account.provider = $1
            AND account.provider_account_id = $2`,
          [provider, providerAccountId]
        );
        return user;
      } catch (err) {
        console.error(err);
      }
    },
    async updateUser(user) {
      try {
        let oldUser = await db.oneOrNone(
          `
            SELECT *
            FROM users
            WHERE id = $1;`,
          [user.id]
        );
        const newUser = {
          ...oldUser,
          ...user,
        };
        const { id, name, email, emailVerified, image } = newUser;
        let updatedUser = await db.oneOrNone(
          `
            UPDATE users
            SET name = $/name/,
            email = $/email/,
            email_verified = $/emailVerified/,
            image = $/image/
            WHERE id = $/id/
            RETURNING name, email, email_verified, image;`,
          {
            name: name,
            email: email,
            emailVerified: emailVerified,
            image: image,
            id: id,
          }
        );
        return updatedUser;
        return null;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async linkAccount(account) {
      try {
        let linkedAccount = await db.oneOrNone(
          `
          INSERT INTO account 
          (
            user_id,
            type,
            provider,
            provider_account_id,
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state
          )
          VALUES (
            $/userId/,
            $/type/,
            $/provider/,
            $/providerAccountId/,
            $/refresh_token/,
            $/access_token/,
            $/expires_at/,
            $/token_type/,
            $/scope/,
            $/id_token/,
            $/session_state/
            )
          RETURNING
            id,  
            user_id,
            type,
            provider,
            provider_account_id,
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state;`,
          {
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          }
        );
        return mapExpiresAt(linkedAccount);
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async createSession({ sessionToken, userId, expires }) {
      try {
        if (userId === undefined) {
          throw Error(`userId is undefined in createSession`);
        }
        let session = await db.oneOrNone(
          `
          INSERT INTO session
          (user_id, expires, session_token)
          VALUES ($/userId/, $/expires/, $/sessionToken/)
          RETURNING id, session_token, user_id, expires;`,
          {
            userId: userId,
            expires: expires,
            sessionToken: sessionToken,
          }
        );
        return session;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async getSessionAndUser(sessionToken) {
      try {
        if (sessionToken === undefined) {
          return null;
        }
        let session = await db.oneOrNone(
          `
          SELECT *
          FROM session
          WHERE session_token = $1;`,
          [sessionToken]
        );
        if (!session) return null;
        let user = await db.oneOrNone(
          `
          SELECT *
            FROM users
            WHERE id = $1;`,
          [session.userId]
        );
        return {
          session,
          user,
        };
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    async updateSession(session) {
      try {
        const { sessionToken } = session;
        let originalSession = await db.oneOrNone(
          `
            SELECT *
            FROM session
            WHERE session_token = $1;`,
          [sessionToken]
        );
        if (!originalSession) return null;
        const newSession = {
          ...originalSession,
          ...session,
        };
        let updatedSession = await db.oneOrNone(
          `
            UPDATE session
            SET
              user_id = $/userId/,
              expires = $/expires/
            WHERE session_token = $/sessionToken/;`,
          {
            userId: newSession.userId,
            expires: newSession.expires,
            sessionToken: newSession.sessionToken,
          }
        );
        return updatedSession;
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async deleteSession(sessionToken) {
      try {
        await db.oneOrNone(
          `
          DELETE FROM session
          WHERE session_token = $1;`,
          [sessionToken]
        );
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async unlinkAccount(partialAccount) {
      try {
        const { provider, providerAccountId } = partialAccount;
        await db.none(
          `
          DELETE FROM account
          WHERE provider_account_id = $1
            AND provider = $2;`,
          [providerAccountId, provider]
        );
      } catch (err) {
        console.error(err);
        return;
      }
    },
    async deleteUser(userId) {
      try {
        await db.task(async (t) => {
          await t.none(
            `
            DELETE FROM users
            WHERE id = $1;`,
            [userId]
          );
          await t.none(
            `
            DELETE FROM session
            WHERE user_id = $1;`,
            [userId]
          );
          await t.none(
            `
            DELETE FROM account
            WHERE user_id = $1;`,
            [userId]
          );
        });
      } catch (err) {
        console.error(err);
        return;
      }
    },
  };
}
