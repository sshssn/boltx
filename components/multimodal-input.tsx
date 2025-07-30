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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';

import { X, Upload, FileText, Image, File, Copy, Zap } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { useMessageLimit } from './message-limit-provider';

// Enhanced file type detection
const getFileIcon = (contentType: string, fileName: string) => {
  // Images
  if (contentType.startsWith('image/')) return <Image className="size-4" />;

  // Documents
  if (contentType === 'application/pdf' || fileName.endsWith('.pdf'))
    return <FileText className="size-4" />;
  if (contentType.includes('word') || fileName.match(/\.(doc|docx)$/i))
    return <FileText className="size-4" />;
  if (contentType.includes('excel') || fileName.match(/\.(xls|xlsx)$/i))
    return <FileText className="size-4" />;
  if (contentType.includes('powerpoint') || fileName.match(/\.(ppt|pptx)$/i))
    return <FileText className="size-4" />;

  // Code files
  if (
    contentType.includes('javascript') ||
    fileName.match(/\.(js|jsx|ts|tsx)$/i)
  )
    return <FileText className="size-4" />;
  if (contentType.includes('python') || fileName.match(/\.py$/i))
    return <FileText className="size-4" />;
  if (contentType.includes('java') || fileName.match(/\.java$/i))
    return <FileText className="size-4" />;
  if (contentType.includes('css') || fileName.match(/\.(css|scss|sass|less)$/i))
    return <FileText className="size-4" />;
  if (contentType.includes('html') || fileName.match(/\.(html|htm)$/i))
    return <FileText className="size-4" />;
  if (fileName.match(/\.(json|xml|yaml|yml|toml|ini|sql|md|txt|csv)$/i))
    return <FileText className="size-4" />;

  // Archives
  if (contentType.includes('zip') || fileName.match(/\.(zip|rar|7z|tar|gz)$/i))
    return <File className="size-4" />;

  // Audio
  if (contentType.startsWith('audio/')) return <File className="size-4" />;

  // Video
  if (contentType.startsWith('video/')) return <File className="size-4" />;

  return <File className="size-4" />;
};

// Paste detection component
const PasteIndicator = ({
  show,
  onDismiss,
}: { show: boolean; onDismiss: () => void }) => {
  if (!show) return null;

  return (
    <div className="absolute top-2 left-1/2  -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/90 text-white text-sm rounded-lg backdrop-blur-sm shadow-lg animate-in slide-in-from-top-2 duration-300">
        <Copy className="size-4" />
        <span>Content pasted</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 hover:bg-white/20 rounded p-0.5"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
};

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
  const [showPasteIndicator, setShowPasteIndicator] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const { incrementMessageCount, remaining, hasReachedLimit } =
    useMessageLimit();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = width && width < 768 ? 100 : 200;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight + 2, maxHeight)}px`;
    }
  }, [width]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const minHeight = width && width < 768 ? 44 : 80;
      textareaRef.current.style.height = `${minHeight}px`;
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  // Enhanced paste handling
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    let hasFiles = false;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          hasFiles = true;
          const file = item.getAsFile();
          if (file) {
            handleFileUpload(file);
          }
        }
      }
    }

    // Show paste indicator for text content
    if (!hasFiles && event.clipboardData?.getData('text')) {
      setShowPasteIndicator(true);
      setTimeout(() => setShowPasteIndicator(false), 3000);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    if (!input.trim() && attachments.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    // Increment message count
    incrementMessageCount();

    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Generate unique message ID with timestamp
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    sendMessage({
      role: 'user',
      id: uniqueId, // Ensure unique ID
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
      // Add reasoning mode metadata
      metadata: {
        createdAt: new Date().toISOString(),
        reasoning: isThinkingMode,
        preferredModel: isThinkingMode ? 'deepseek-r1' : undefined,
      } as any, // Type assertion for custom metadata
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');
    setIsThinkingMode(false); // Reset thinking mode after sending

    setTimeout(() => {
      const event = new CustomEvent('refreshMessageCount');
      window.dispatchEvent(event);
    }, 1000);

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
    hasReachedLimit,
    incrementMessageCount,
    resetHeight,
    isThinkingMode,
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

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Validate file type and size
      const maxSize = 50 * 1024 * 1024; // 50MB for larger documents and videos
      if (file.size > maxSize) {
        toast.error('File size must be less than 50MB');
        return;
      }

      const allowedTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
        'image/heic',
        'image/heif',

        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/html',
        'text/markdown',
        'text/xml',
        'application/json',
        'application/xml',

        // Code files
        'text/javascript',
        'text/typescript',
        'text/css',
        'text/scss',
        'text/sass',
        'text/less',
        'text/python',
        'text/java',
        'text/c',
        'text/cpp',
        'text/csharp',
        'text/php',
        'text/ruby',
        'text/go',
        'text/rust',
        'text/swift',
        'text/kotlin',
        'text/scala',
        'text/r',
        'text/matlab',
        'text/sql',
        'text/yaml',
        'text/toml',
        'text/ini',
        'text/bash',
        'text/shell',
        'text/dockerfile',
        'text/makefile',

        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',

        // Audio (for transcription)
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'audio/aac',
        'audio/flac',

        // Video (for frame extraction)
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/mkv',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported');
        return;
      }

      setUploadQueue((prev) => [...prev, file.name]);

      try {
        const uploadedAttachment = await uploadFile(file);
        if (uploadedAttachment) {
          setAttachments((current) => [...current, uploadedAttachment]);
          toast.success(`${file.name} uploaded successfully`);
        }
      } catch (error) {
        console.error('Error uploading file!', error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadQueue((prev) => prev.filter((name) => name !== file.name));
      }
    },
    [setAttachments, setUploadQueue],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      for (const file of files) {
        await handleFileUpload(file);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setAttachments, handleFileUpload],
  );

  // Drag and drop handling
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach(handleFileUpload);
    },
    [handleFileUpload],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const removeAttachment = (urlToRemove: string) => {
    setAttachments((current) =>
      current.filter((att) => att.url !== urlToRemove),
    );
  };

  return (
    <div className="relative w-full">
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-xl p-8 border border-blue-200 dark:border-blue-700 shadow-2xl">
            <Upload className="size-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-center text-zinc-900 dark:text-zinc-100">
              Drop files here to upload
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-2">
              Supports images, PDFs, and text files
            </p>
          </div>
        </div>
      )}

      <PasteIndicator
        show={showPasteIndicator}
        onDismiss={() => setShowPasteIndicator(false)}
      />

      {/* Attachments preview */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="mb-3 md:mb-4 flex flex-wrap gap-1.5 md:gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.url}
              className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-zinc-700/50 shadow-sm"
            >
              {getFileIcon(attachment.contentType, attachment.name)}
              <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-16 md:max-w-32">
                {attachment.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.url)}
                className="text-zinc-400 hover:text-red-500 transition-colors"
              >
                <X className="size-2 md:size-3" />
              </button>
            </div>
          ))}

          {uploadQueue.map((filename) => (
            <div
              key={filename}
              className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-200/30 dark:border-blue-700/30 shadow-sm"
            >
              <div className="size-2.5 md:size-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs md:text-sm text-blue-700 dark:text-blue-300 truncate max-w-16 md:max-w-32">
                {filename}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div
        className={cx('relative', disabled && 'pointer-events-none')}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className={cx(
            'relative flex items-end min-h-[44px] md:min-h-[80px] w-full',
            // Consistent glassmorphism that doesn't change on focus
            'bg-white/90 dark:bg-zinc-900/90',
            'backdrop-blur-xl backdrop-saturate-150',
            'border border-zinc-200/60 dark:border-zinc-700/60',
            'shadow-lg shadow-black/5 dark:shadow-black/20',
            'rounded-xl md:rounded-2xl',
            'transition-all duration-200 ease-out',
            // Subtle hover and focus effects without changing the main blur
            'hover:bg-white/95 dark:hover:bg-zinc-900/95',
            'focus-within:border-zinc-300/80 dark:focus-within:border-zinc-600/80',
            'focus-within:shadow-xl focus-within:shadow-black/10',
            isDragging &&
              'border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20',
          )}
        >
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.txt,.json,.csv"
          />

          {/* Textarea */}
          <ShadcnTextarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onPaste={handlePaste}
            placeholder="Type your message here..."
            className={cx(
              'flex-1 min-h-[44px] max-h-[100px] md:min-h-[80px] md:max-h-[240px] resize-none',
              'bg-transparent border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:outline-none',
              'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
              'px-3 py-2 pr-12 md:px-5 md:py-5 md:pr-28 text-sm md:text-base leading-6 md:leading-7',
              'scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            style={{
              boxShadow: 'none',
              outline: 'none',
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (status === 'streaming') {
                  toast.error('Please wait for AI to finish responding...');
                } else {
                  submitForm();
                }
              }
            }}
            disabled={disabled || limitReached}
          />

          {/* Action buttons */}
          <div className="absolute bottom-1.5 right-1.5 md:bottom-3 md:right-3 flex items-center gap-1 md:gap-2">
            <TooltipProvider delayDuration={0}>
              {status === 'streaming' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ShadcnButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={stop}
                      className={cx(
                        'h-7 w-7 md:h-10 md:w-10 rounded-full p-0 touch-manipulation',
                        'bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30',
                        'text-red-600 dark:text-red-400',
                        'border border-red-200/50 dark:border-red-700/50',
                        'transition-all duration-200',
                      )}
                      aria-label="Stop generation"
                    >
                      <StopIcon size={12} />
                    </ShadcnButton>
                  </TooltipTrigger>
                  <TooltipContent>Stop generation</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShadcnButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className={cx(
                          'h-7 w-7 md:h-10 md:w-10 rounded-full p-0 touch-manipulation',
                          'bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80',
                          'text-zinc-600 dark:text-zinc-400',
                          'border border-zinc-200/50 dark:border-zinc-700/50',
                          'transition-all duration-200',
                        )}
                        disabled={limitReached}
                        aria-label="Attach file"
                      >
                        <PaperclipIcon size={12} />
                      </ShadcnButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      Attach files (images, PDFs, documents)
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShadcnButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsThinkingMode(!isThinkingMode)}
                        className={cx(
                          'h-7 w-7 md:h-10 md:w-10 rounded-full p-0 touch-manipulation',
                          'transition-all duration-200',
                          isThinkingMode
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50'
                            : 'bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50',
                        )}
                        disabled={limitReached}
                        aria-label={
                          isThinkingMode
                            ? 'Disable reasoning mode'
                            : 'Enable thinking model'
                        }
                      >
                        <Zap size={12} />
                      </ShadcnButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isThinkingMode
                        ? 'Disable reasoning mode'
                        : 'Thinking Model'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShadcnButton
                        type="button"
                        size="sm"
                        onClick={submitForm}
                        disabled={
                          limitReached ||
                          (!input.trim() && attachments.length === 0) ||
                          uploadQueue.length > 0
                        }
                        className={cx(
                          'h-7 w-7 md:h-10 md:w-10 rounded-full p-0 touch-manipulation',
                          'bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500',
                          'text-white',
                          'shadow-sm',
                          'transition-all duration-200',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                        aria-label="Send message"
                      >
                        <ArrowUpIcon size={12} />
                      </ShadcnButton>
                    </TooltipTrigger>
                    <TooltipContent>Send message (Enter)</TooltipContent>
                  </Tooltip>
                </>
              )}
            </TooltipProvider>
          </div>

          {/* Helper text */}
          <div className="absolute bottom-1.5 left-3 md:bottom-3 md:left-5 text-xs text-zinc-400 dark:text-zinc-500 select-none pointer-events-none">
            {uploadQueue.length > 0
              ? `Uploading ${uploadQueue.length} file${uploadQueue.length > 1 ? 's' : ''}...`
              : isThinkingMode
                ? 'Reasoning mode: DeepSeek R1 will respond'
                : 'Shift + Enter for new line'}
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
    if (prevProps.disabled !== nextProps.disabled) return false;
    if (prevProps.limitReached !== nextProps.limitReached) return false;
    return true;
  },
);
