'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

// Email validation for major providers
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'microsoft.com',
];

const validateEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

const authFormSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (email) => validateEmailDomain(email),
      'Please use a supported email provider (Gmail, iCloud, Yahoo, Microsoft)',
    ),
  password: z.string().min(6),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username must contain only letters, numbers, underscores, and hyphens',
    )
    .optional(),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // Create user with username
    await createUser(
      validatedData.email,
      validatedData.password,
      validatedData.username,
    );

    // Sign in immediately
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
