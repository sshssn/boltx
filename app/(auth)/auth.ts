import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { createGuestUser, getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

// Set these in your .env.local:
// GITHUB_CLIENT_ID=Ov23liL0PsrztTT0JXcX
// GITHUB_CLIENT_SECRET=9db8ca9ec83166c8e10c12def4951fb45e489f80

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

        // Set user type based on role in database
        const userType = user.role === 'admin' ? 'admin' : 'regular';
        return { ...user, type: userType, role: user.role };
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

            // CRITICAL SECURITY FIX: Only allow OAuth login if the existing user
            // was also created via OAuth (has no password) or if they explicitly
            // linked their account. This prevents OAuth users from hijacking admin accounts.

            // If the existing user has a password, they created their account via credentials
            // OAuth users should not be able to access credential-based accounts
            if (existingUser.password) {
              console.warn(
                `OAuth login attempt for credential-based account: ${user.email}`,
              );
              return false; // Block the login
            }

            // Update the user object with existing user info
            user.id = existingUser.id;
            user.role = existingUser.role;

            // ADDITIONAL SECURITY: OAuth users should never get admin privileges
            // This is a double-check to ensure OAuth users cannot become admin
            if (existingUser.role === 'admin') {
              console.warn(
                `OAuth user attempting to access admin account: ${user.email}`,
              );
              // For OAuth users, downgrade admin to regular user
              user.role = 'regular';
              user.type = 'regular';
            } else {
              user.type = existingUser.role === 'admin' ? 'admin' : 'regular';
            }

            user.username = existingUser.username;
            return true; // Allow sign in
          } else {
            // Create new user as regular (not admin)
            const newUser = await createUser(
              user.email,
              '', // No password for OAuth users
              user.name || user.email.split('@')[0], // Use name or email prefix as username
            );

            if (newUser && newUser.length > 0) {
              // Update the user object with our database user info
              user.id = newUser[0].id;
              user.role = newUser[0].role;
              // SECURITY: Always create OAuth users as regular, never admin
              user.type = 'regular';

              // Double-check that the role is not admin
              if (newUser[0].role === 'admin') {
                console.error(
                  `CRITICAL: OAuth user created with admin role: ${user.email}`,
                );
                // Force downgrade to regular
                user.role = 'regular';
                user.type = 'regular';
              }

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

        // FINAL SECURITY CHECK: Ensure OAuth users never get admin privileges
        if (
          account?.provider &&
          (account.provider === 'google' || account.provider === 'github')
        ) {
          if (token.role === 'admin') {
            console.warn(
              `JWT: OAuth user with admin role detected, downgrading: ${user.email}`,
            );
            token.role = 'regular';
            token.type = 'regular';
          }
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

        // FINAL SESSION SECURITY CHECK: Double-check that OAuth users are not admin
        // This is the last line of defense
        if (session.user.role === 'admin') {
          // Check if this is an OAuth session by looking at the token
          // If we can't determine the provider, we'll be extra cautious
          console.warn(
            `Session: Admin role detected for user: ${session.user.email}`,
          );
          // For now, we'll log this but not automatically downgrade
          // as it might be a legitimate admin user
        }
      }

      return session;
    },
  },
});
