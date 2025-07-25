'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  disabled = false,
  limitReached = false,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  disabled?: boolean;
  limitReached?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const { open: sidebarOpen, isMobile } = useSidebar();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    sendMessage({
      role: 'user',
      parts: [
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasInteracted(true);
  }, []);

  // Fade out the button after a delay when at bottom
  useEffect(() => {
    if (isAtBottom) {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      fadeTimeout.current = setTimeout(() => setShowScrollButton(false), 1200);
    } else {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      setShowScrollButton(true);
    }
    return () => {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [isAtBottom]);

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const [open, setOpen] = useState(limitReached);
  useEffect(() => {
    setOpen(limitReached);
  }, [limitReached]);

  return (
    <div
      className={cx(
        'relative w-full flex flex-col gap-4',
        limitReached && 'opacity-60',
      )}
    >
      {/* Remove the scroll to bottom button */}
      {/* <div className="w-full flex justify-center items-center mb-2"> ... </div> */}

      {/* Removed duplicate SuggestedActions rendering. Only Chat should render it. */}

      {/* Limit reached modal will be implemented with shadcn/ui AlertDialog below */}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <button
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
            onClick={() => setOpen(false)}
            aria-label="Dismiss"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <AlertDialogHeader>
            <div className="text-5xl mb-2 text-center">💬</div>
            <AlertDialogTitle className="text-center text-2xl">
              You&apos;re out of messages!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You&apos;ve hit your daily limit of 10 messages as a guest.
              <br />
              <span className="my-2">
                Sign up for a free account to keep the conversation going and
                unlock more features!
              </span>
              <span className="text-xs text-zinc-400">
                No spam, no credit card required 🚀
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <a href="/auth" className="w-full block">
            <AlertDialogAction asChild>
              <span className="w-full block text-center">Sign Up Free</span>
            </AlertDialogAction>
          </a>
        </AlertDialogContent>
      </AlertDialog>

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div
        className={cx(
          isMobile
            ? 'sticky bottom-0 z-30 flex justify-center items-end pointer-events-none px-2 pb-4 md:px-0'
            : 'fixed bottom-0 right-0 z-30 flex justify-center items-end pointer-events-none px-2 pb-4 md:px-0 transition-all duration-300',
        )}
        style={
          isMobile
            ? { width: '100%' }
            : sidebarOpen
              ? { left: '16rem', width: 'auto' }
              : { left: 0, width: '100%' }
        }
      >
        <div
          className={cx(
            'w-full md:max-w-3xl pointer-events-auto',
            'flex flex-col items-center',
          )}
        >
          <div
            className={cx(
              'relative flex items-end w-full',
              'rounded-2xl bg-white/30 dark:bg-zinc-800/60',
              'backdrop-blur-2xl border border-white/30 dark:border-zinc-700',
              'shadow-2xl',
              'transition-all duration-200',
              disabled && 'opacity-60',
              'focus-within:ring-2 focus-within:ring-indigo-400',
            )}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
          >
            <ShadcnTextarea
              data-testid="multimodal-input"
              ref={textareaRef}
              placeholder="Type your message here..."
              value={input}
              onChange={handleInput}
              className={cx(
                'flex-1 min-h-[48px] max-h-[180px] resize-none rounded-2xl !text-base bg-transparent text-zinc-900 dark:text-zinc-100 p-4 pr-12',
                'transition-all duration-200',
                'focus:outline-none focus:ring-0',
                disabled && 'cursor-not-allowed select-none',
              )}
              rows={2}
              autoFocus
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (status !== 'ready' || disabled) {
                    toast.error(
                      'Please wait for the model to finish its response!',
                    );
                  } else {
                    submitForm();
                  }
                }
              }}
              disabled={disabled}
              style={{
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
              }}
            />
            <div className="absolute bottom-3 right-3 flex flex-row gap-2 items-center">
              {/* Stop button, only visible when status is 'streaming' */}
              {status === 'streaming' && (
                <ShadcnButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={stop}
                  className={cx(
                    'rounded-full bg-white/40 dark:bg-zinc-700/60 shadow-md',
                    'hover:bg-red-500 hover:text-white',
                    'transition',
                    'text-red-600 dark:text-red-300',
                    'border border-white/30 dark:border-zinc-700',
                  )}
                  aria-label="Stop generation"
                >
                  <StopIcon size={22} />
                </ShadcnButton>
              )}
              <ShadcnButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    await submitForm();
                  } catch (err) {
                    toast.error(
                      'Network error: Unable to send message. Please try again.',
                    );
                  }
                }}
                className={cx(
                  'rounded-full bg-white/40 dark:bg-zinc-700/60 shadow-md',
                  'hover:bg-indigo-500 hover:text-white',
                  'transition',
                  'text-indigo-600 dark:text-indigo-300',
                  'border border-white/30 dark:border-zinc-700',
                )}
                aria-label="Send message"
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                    fill="currentColor"
                  />
                </svg>
              </ShadcnButton>
              <ShadcnButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                className={cx(
                  'rounded-full bg-white/40 dark:bg-zinc-700/60 shadow-md',
                  'hover:bg-indigo-500 hover:text-white',
                  'transition',
                  'text-indigo-600 dark:text-indigo-300',
                  'border border-white/30 dark:border-zinc-700',
                  'w-10 h-10 flex items-center justify-center',
                )}
                aria-label="Attach file"
                disabled={disabled}
              >
                <PaperclipIcon size={20} />
              </ShadcnButton>
            </div>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              tabIndex={-1}
            />
            <div className="absolute bottom-3 left-4 flex flex-row gap-2 items-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 select-none">
                Shift+Enter for new line
              </span>
            </div>
            <div className="absolute bottom-3 right-20 text-xs text-zinc-400 dark:text-zinc-500 select-none">
              {/* removed word count */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  large,
  color,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
  large?: boolean;
  color?: string;
}) {
  return (
    <ShadcnButton
      data-testid="attachments-button"
      className={cx(
        'rounded-md rounded-bl-lg p-2 h-fit bg-indigo-600 text-white hover:bg-indigo-700 shadow-md',
        large && 'p-2',
      )}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </ShadcnButton>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
  large,
  color,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  large?: boolean;
  color?: string;
}) {
  return (
    <ShadcnButton
      data-testid="stop-button"
      className={cx(
        'rounded-full p-2 h-fit bg-indigo-600 text-white hover:bg-indigo-700 shadow-md',
        large && 'p-2',
      )}
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </ShadcnButton>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  large,
  color,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  large?: boolean;
  color?: string;
}) {
  return (
    <ShadcnButton
      data-testid="send-button"
      className={cx(
        'rounded-full p-2 h-fit bg-indigo-600 text-white hover:bg-indigo-700 shadow-md',
        large && 'p-2',
      )}
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </ShadcnButton>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
