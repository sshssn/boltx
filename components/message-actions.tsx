import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types';
import { RefreshCw, Play } from 'lucide-react';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  regenerate,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  regenerate?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-500 transition"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-500 transition"
              variant="outline"
              onClick={() => {
                if (regenerate) {
                  regenerate();
                  toast.success('Regenerating response...');
                }
              }}
              disabled={!regenerate}
            >
              <RefreshCw size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Retry Response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
