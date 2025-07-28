import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

// Set these in your .env.local:
// GITHUB_CLIENT_ID=Ov23liL0PsrztTT0JXcX
// GITHUB_CLIENT_SECRET=9db8ca9ec83166c8e10c12def4951fb45e489f80

export type UserType = 'guest' | 'regular' | 'pro';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      username?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    username?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    username?: string | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '', // Set in .env.local
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '', // Set in .env.local
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.username = user.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.username = token.username;
      }

      return session;
    },
  },
});
