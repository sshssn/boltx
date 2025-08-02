import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { createGuestUser, getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular' | 'pro' | 'admin';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      type: UserType;
      username?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    username?: string | null;
    role: string;
    type: UserType;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    type: UserType;
    username?: string | null;
    image?: string | null;
  }
}

// Debug environment variables in production
if (process.env.NODE_ENV === 'production') {
  console.log('Auth Environment Variables:', {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
  });
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
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                scope: 'read:user user:email',
              },
            },
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
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

        // SIMPLE LOGIC: Only sshssn@yahoo.com is admin
        const isAdmin = email === 'sshssn@yahoo.com';
        const userType = isAdmin ? 'admin' : 'regular';
        const role = isAdmin ? 'admin' : 'regular';
        
        return { ...user, type: userType, role };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest', role: 'guest' };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins (Google, GitHub)
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) {
          return false;
        }

        try {
          // Check if user already exists
          const existingUsers = await getUser(user.email);

          if (existingUsers.length > 0) {
            // User exists, update their information
            const existingUser = existingUsers[0];

            // SIMPLE LOGIC: OAuth users are never admin
            user.id = existingUser.id;
            user.role = 'regular';
            user.type = 'regular';
            user.username = existingUser.username;
            return true;
          } else {
            // Create new user as regular (never admin)
            const newUser = await createUser(
              user.email,
              '', // No password for OAuth users
              user.name || user.email.split('@')[0], // Use name or email prefix as username
            );

            if (newUser && newUser.length > 0) {
              // Update the user object with our database user info
              user.id = newUser[0].id;
              user.role = 'regular';
              user.type = 'regular';
              return true;
            }
          }
        } catch (error) {
          console.error('Error handling OAuth sign in:', error);
          return false;
        }
      }

      return true; // Allow other sign-ins
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.role = user.role;
        token.username = user.username;
        token.image = user.image;

        // SIMPLE LOGIC: OAuth users are never admin
        if (
          account?.provider &&
          (account.provider === 'google' || account.provider === 'github')
        ) {
          token.role = 'regular';
          token.type = 'regular';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.image = token.image;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Fix OAuth redirect - always redirect to chat page after successful login
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
});
