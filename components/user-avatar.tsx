'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrlForComponent } from '@/lib/gravatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  email?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({
  email,
  name,
  size = 32,
  className,
  showStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const displayName = name || email?.split('@')[0] || 'User';
  const avatarUrl = email ? getAvatarUrlForComponent(email, size) : null;

  return (
    <div className={cn('relative', className)}>
      <Avatar
        className="rounded-full"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {avatarUrl && (
          <AvatarImage
            src={avatarUrl}
            alt={`${displayName}'s avatar`}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
