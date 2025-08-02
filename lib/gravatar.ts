// @ts-expect-error: no types for blueimp-md5
import md5 from 'blueimp-md5';

export interface GravatarOptions {
  size?: number;
  default?:
    | '404'
    | 'mp'
    | 'identicon'
    | 'monsterid'
    | 'wavatar'
    | 'retro'
    | 'robohash'
    | 'blank';
  rating?: 'g' | 'pg' | 'r' | 'x';
  force?: 'y' | 'n';
}

/**
 * Generate a Gravatar URL for an email address
 * Supports all email providers including Google, Yahoo, GitHub, etc.
 */
export function getGravatarUrl(
  email: string,
  options: GravatarOptions = {},
): string {
  if (!email) {
    return getDefaultAvatarUrl();
  }

  const {
    size = 200,
    default: defaultImage = 'identicon',
    rating = 'g',
    force = 'n',
  } = options;

  // Create MD5 hash of the email (lowercase and trimmed)
  const hash = md5(email.trim().toLowerCase());

  // Build the URL with parameters
  const params = new URLSearchParams({
    s: size.toString(),
    d: defaultImage,
    r: rating,
    f: force,
  });

  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`;
}

/**
 * Get a default avatar URL when no email is available
 */
export function getDefaultAvatarUrl(): string {
  return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&s=200';
}

/**
 * Check if an email has a Gravatar image
 */
export async function hasGravatar(email: string): Promise<boolean> {
  if (!email) return false;

  try {
    const url = getGravatarUrl(email, { default: '404' });
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get avatar URL with fallback options
 * Priority: Gravatar → Provider-specific → Default
 */
export function getAvatarUrl(email: string, size = 200): string {
  if (!email) {
    return getDefaultAvatarUrl();
  }

  // For GitHub users, try to get their GitHub avatar
  if (email.includes('@users.noreply.github.com')) {
    const username = email.split('@')[0].replace('+', '');
    return `https://github.com/${username}.png?size=${size}`;
  }

  // For Google users, use Gravatar with better fallback
  if (email.includes('@gmail.com') || email.includes('@googlemail.com')) {
    return getGravatarUrl(email, { size, default: 'retro' });
  }

  // For Yahoo users, Gravatar works well
  if (email.includes('@yahoo.com') || email.includes('@ymail.com')) {
    return getGravatarUrl(email, { size, default: 'identicon' });
  }

  // For all other providers, use Gravatar with identicon fallback
  return getGravatarUrl(email, { size, default: 'identicon' });
}

/**
 * Get avatar URL for React components with proper sizing
 */
export function getAvatarUrlForComponent(email: string, size = 32): string {
  return getAvatarUrl(email, size);
}
