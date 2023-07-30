// https://github.com/nextauthjs/next-auth/issues/5822
// https://github.com/nextauthjs/next-auth/issues/5822
// https://github.com/nextauthjs/next-auth/issues/5822
// LOOK INTO DATABASE SESSIONS... USING JWT FOR NOW

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PostgresAdapter } from '../../../common/utils/nextauth/postgresAdapter';

import { getDB } from '../../../common/utils/pgp';
const { db } = getDB();

export const authOptions: NextAuthOptions = {
  // debug: process.env.NODE_ENV !== 'production',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  adapter: PostgresAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, trigger, session, user, account, profile }) {
      if (trigger === 'signIn') {
        // User = database user
        token.name = user?.name || profile?.name || '';
        token.display_name = user?.display_name || profile?.given_name || '';
        token.image = user?.image || profile?.picture || '';
        token.color_mode = user?.color_mode || null;
      }
      if (trigger === 'update' && session) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        if (typeof session.name === 'string') {
          token.name = session.name || '';
        }
        if (typeof session.display_name === 'string') {
          token.display_name = session.display_name || '';
        }
        if (typeof session.image === 'string') {
          token.image = session.image || '';
        }
        if ('color_mode' in session) {
          if (session.color_mode === null) {
            token.color_mode = null;
          } else if (typeof session.color_mode === 'string') {
            token.color_mode = session.color_mode;
          }
        }
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.display_name = token.display_name || '';
        session.user.image = token.image || '';
        session.user.color_mode = token.color_mode || null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
