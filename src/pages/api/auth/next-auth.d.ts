import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      email_verified?: Date | null;
      image?: string | null;
      display_name?: string | null;
      color_mode?: 'light' | 'dark' | null;
    };
  }
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    display_name?: string | null;
    color_mode?: 'light' | 'dark' | null;
  }
  /** The OAuth profile returned from your provider */
  interface Profile {
    picture?: string | null;
    given_name?: string | null;
  }
}

// https://next-auth.js.org/getting-started/typescript#submodules
declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** Display Name */
    color_mode: 'light' | 'dark' | null;
    display_name: string | null;
    image: string | null;
  }
}
