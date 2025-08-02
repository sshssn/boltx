import Link from 'next/link';
import React, {
  memo,
  useEffect,
  useState,
  Children,
  isValidElement,
  useRef,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// External Link Warning Modal Component
function ExternalLinkWarning({
  url,
  title,
  domain,
  isOpen,
  onClose,
  onProceed,
}: {
  url: string;
  title: string;
  domain: string;
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              External Link Warning
            </h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re about to leave boltX
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-card-foreground font-medium mb-1">
              {title}
            </p>
            <p className="text-xs text-muted-foreground break-all">{url}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Security Notice:</strong> This link will take you to an
              external website. Please verify the URL is safe before proceeding.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Link
          </button>
        </div>
      </div>
    </div>
  );
}

// CopyButton component
function CopyButton({
  getContent,
  className = '',
}: { getContent: () => string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCopy = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getContent());
      setCopied(true);
      setShowFeedback(true);
      setTimeout(() => {
        setCopied(false);
        setShowFeedback(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="relative inline-block">
      {!showFeedback && (
        <button
          type="button"
          aria-label="Copy to clipboard"
          className={`bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${className}`}
          onClick={handleCopy}
          onTouchStart={handleCopy}
        >
          Copy
        </button>
      )}
      {showFeedback && (
        <div
          className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-md px-3 py-1.5 text-xs font-medium border border-green-200 dark:border-green-700"
          aria-live="polite"
        >
          ✓ Copied!
        </div>
      )}
    </div>
  );
}

// Sources Container Component
function SourcesContainer({
  sources,
}: { sources: Array<{ title: string; url: string; domain: string }> }) {
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    domain: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    domain: '',
  });

  const [failedFavicons, setFailedFavicons] = useState<Set<string>>(new Set());
  const [showAllSources, setShowAllSources] = useState(false);

  // Function to get favicon URL with fallbacks
  const getFaviconUrl = (domain: string) => {
    // Use DuckDuckGo's favicon service which is more reliable
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  };

  const handleFaviconError = (domain: string) => {
    setFailedFavicons((prev) => new Set(prev).add(domain));
  };

  if (!sources || sources.length === 0) return null;

  const handleLinkClick = (
    e: React.MouseEvent,
    source: { title: string; url: string; domain: string },
  ) => {
    e.preventDefault();
    setWarningModal({
      isOpen: true,
      url: source.url,
      title: source.title,
      domain: source.domain,
    });
  };

  const handleProceed = () => {
    window.open(warningModal.url, '_blank', 'noopener,noreferrer');
    setWarningModal({ isOpen: false, url: '', title: '', domain: '' });
  };

  const handleClose = () => {
    setWarningModal({ isOpen: false, url: '', title: '', domain: '' });
  };

  return (
    <>
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 mt-8 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h4 className="text-base font-medium text-card-foreground">
            Sources ({sources.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(showAllSources ? sources : sources.slice(0, 6)).map(
            (source, index) => (
              <button
                type="button"
                key={`${source.domain}-${source.title}-${index}`}
                onClick={(e) => handleLinkClick(e, source)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/60 transition-all duration-200 group border border-border/50 hover:border-ring max-w-sm text-left bg-card/50 hover:bg-card"
              >
                <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={getFaviconUrl(source.domain)}
                    alt={`${source.domain} favicon`}
                    className="w-6 h-6 rounded-md shadow-sm bg-white dark:bg-gray-800 border border-border/50 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold hidden absolute top-0 left-0">
                    {source.title.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {source.title}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5 line-clamp-1">
                    {source.domain}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            ),
          )}
        </div>

        {/* Show More/Less button */}
        {sources.length > 6 && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => setShowAllSources(!showAllSources)}
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary/20 hover:border-primary/40 rounded-md"
            >
              {showAllSources
                ? `Show Less (${6})`
                : `Show More (${sources.length - 6})`}
            </button>
          </div>
        )}
      </div>

      <ExternalLinkWarning
        url={warningModal.url}
        title={warningModal.title}
        domain={warningModal.domain}
        isOpen={warningModal.isOpen}
        onClose={handleClose}
        onProceed={handleProceed}
      />
    </>
  );
}

// IMPROVED TEXT PROCESSING FUNCTIONS

// Check if text looks incomplete (cut off)
const isIncompleteText = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  // Check for common incomplete patterns
  const incompletePatterns = [
    /\w+\s*$/, // ends with partial word
    /[,;]\s*$/, // ends with comma or semicolon
    /\b(and|or|but|the|a|an|in|on|at|to|for|of|with|by)\s*$/i, // ends with common connecting words
    /\d+\.\s*$/, // ends with number and period (incomplete list item)
    /:\s*$/, // ends with colon
    /\([^)]*$/, // unclosed parentheses
    /\[[^\]]*$/, // unclosed brackets
    /"[^"]*$/, // unclosed quotes
  ];
  
  return incompletePatterns.some(pattern => pattern.test(trimmed));
};

// Smart text cleaning and formatting
const smartTextProcessing = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text;
  
  // Step 1: Handle incomplete text by adding ellipsis if needed
  if (isIncompleteText(processed)) {
    processed = processed.trim() + '...';
  }
  
  // Step 2: Fix spacing between numbers and letters (the main issue you mentioned)
  processed = processed
    // Fix "results98" -> "results 98"
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Fix "98results" -> "98 results"  
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Fix "version2.0" -> "version 2.0"
    .replace(/([a-zA-Z])(\d+\.?\d*)/g, '$1 $2')
    // Fix "2.0version" -> "2.0 version"
    .replace(/(\d+\.?\d*)([a-zA-Z])/g, '$1 $2')
    // Fix "COVID19" -> "COVID 19" (but keep common abbreviations)
    .replace(/([A-Z]{2,})(\d+)/g, (match, letters, numbers) => {
      // Keep common tech terms together
      const keepTogether = ['HTML5', 'CSS3', 'HTTP2', 'IPv4', 'IPv6', 'UTF8', 'MD5', 'SHA256'];
      if (keepTogether.includes(match)) return match;
      return `${letters} ${numbers}`;
    });
  
  // Step 3: Fix percentage formatting
  processed = processed
    .replace(/(\d+)%/g, '$1%') // Keep percentages together
    .replace(/(\d+)\s*-\s*(\d+)%/g, '$1-$2%') // Fix ranges like "10 - 20%" -> "10-20%"
    .replace(/(\d+)percent/gi, '$1%'); // Convert "percent" to "%"
  
  // Step 4: Fix currency and units
  processed = processed
    .replace(/\$(\d)/g, '$$$1') // Ensure $ is attached to numbers
    .replace(/(\d+)(USD|EUR|GBP|JPY|CAD)/gi, '$1 $2') // Add space before currency codes
    .replace(/(\d+)(kg|lb|oz|g|mg|km|mi|ft|in|cm|mm|m)/g, '$1 $2'); // Add space before units
  
  // Step 5: Fix common word combinations that get stuck together
  processed = processed
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/(\w)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g, '$1 $2') // Fix months
    .replace(/(\w)(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/g, '$1 $2') // Fix days
    .replace(/(\w)(AM|PM)/g, '$1 $2'); // Fix time
  
  // Step 6: Fix punctuation spacing
  processed = processed
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .replace(/([,;])\s*(\w)/g, '$1 $2') // Ensure space after commas and semicolons
    .replace(/(\w)\s*([.!?])/g, '$1$2') // Remove space before sentence endings
    .replace(/\s*([,;])/g, '$1') // Remove space before commas and semicolons
    .replace(/([.!?]){2,}/g, '$1') // Remove multiple sentence endings
    .replace(/\s*:\s*/g, ': ') // Normalize colon spacing
    .replace(/\s*;\s*/g, '; '); // Normalize semicolon spacing
  
  // Step 7: Fix parentheses and brackets
  processed = processed
    .replace(/\s*\(\s*/g, ' (') // Space before opening parenthesis
    .replace(/\s*\)\s*/g, ') ') // Space after closing parenthesis
    .replace(/\s*\[\s*/g, ' [') // Space before opening bracket
    .replace(/\s*\]\s*/g, '] '); // Space after closing bracket
  
  // Step 8: Fix quote spacing
  processed = processed
    .replace(/\s*"\s*/g, ' "') // Normalize quote spacing
    .replace(/"\s*(\w)/g, '"$1') // Remove space after opening quote
    .replace(/(\w)\s*"/g, '$1"'); // Remove space before closing quote
  
  // Step 9: Clean up multiple spaces and normalize whitespace
  processed = processed
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/\n\s+/g, '\n') // Remove spaces at start of lines
    .replace(/\s+\n/g, '\n') // Remove spaces at end of lines
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines -> double newline
    .replace(/^\s+|\s+$/g, ''); // Trim start and end
  
  // Step 10: Handle special cases and technical terms
  processed = processed
    .replace(/([Ww]eb)\s*([Ss]ite)/g, '$1$2') // website
    .replace(/([Ee]mail)/g, 'email') // normalize email
    .replace(/([Dd]ata)\s*([Bb]ase)/g, '$1$2') // database
    .replace(/([Uu]ser)\s*([Nn]ame)/g, '$1$2') // username
    .replace(/([Pp]ass)\s*([Ww]ord)/g, '$1$2') // password
    .replace(/([Ff]ile)\s*([Nn]ame)/g, '$1$2') // filename
    .replace(/([Uu]pdate)/g, 'update') // normalize update
    .replace(/([Dd]ownload)/g, 'download'); // normalize download
  
  return processed;
};

// Extract and store links for the glass container
const extractAndStoreLinks = (
  text: string,
): {
  cleanText: string;
  sources: Array<{ title: string; url: string; domain: string }>;
} => {
  const sources: Array<{ title: string; url: string; domain: string }> = [];

  // Extract links from source citations - handle multiple formats
  const patterns = [
    /\[(?:\*{0,2}Source:\s*)?([^[\]]*?)\s*-\s*(?:\*{0,2})?(https?:\/\/[^\]]+?)(?:\*{0,2})?\]/g,
    /Source:\s*([^-\n]+?)\s*-\s*(https?:\/\/[^\s\n]+)/g,
    /\*{0,2}Source:\*{0,2}\s*([^\n-]+)/g,
  ];

  let cleanText = text;

  patterns.forEach((pattern) => {
    cleanText = cleanText.replace(pattern, (match, title, url) => {
      if (url && typeof url === 'string') {
        const cleanUrl = url.replace(/\*+/g, '').trim();
        try {
          const domain = new URL(cleanUrl).hostname.replace('www.', '');
          const cleanTitle =
            title && typeof title === 'string'
              ? title.replace(/\*+/g, '').trim()
              : '';

          sources.push({
            title: cleanTitle,
            url: cleanUrl,
            domain: domain,
          });
        } catch (e) {
          console.warn('Invalid URL:', cleanUrl);
        }
      }

      return `**Source:** ${title && typeof title === 'string' ? title.replace(/\*+/g, '').trim() : ''}`;
    });
  });

  return { cleanText, sources };
};

// Ultimate web search formatter with improved text processing
const formatWebSearchResults = (
  text: string,
): {
  content: string;
  sources: Array<{ title: string; url: string; domain: string }>;
} => {
  // Apply smart text processing first
  const processedText = smartTextProcessing(text);
  
  // Don't format if it doesn't look like search results
  if (
    !processedText.includes('Source:') &&
    !processedText.includes('📊') &&
    !processedText.includes('📰') &&
    !processedText.includes('🏛️')
  ) {
    return { content: processedText, sources: [] };
  }

  // Extract links
  const { cleanText, sources } = extractAndStoreLinks(processedText);

  // Limit sources to 6 without any automatic filtering
  const limitedSources = sources.slice(0, 6);

  // Remove any existing HTML containers
  let content = cleanText.replace(
    /<div class["']sources-container.*?<\/div>/gs,
    '',
  );

  // Remove intro lines
  content = content.replace(
    /^Based on my web search capabilities[^:]*:\s*/i,
    '',
  );

  // Clean up formatting issues
  content = content
    // Remove asterisks and bullets
    .replace(/^\s*[•*]\s*\*/gm, '')
    .replace(/^\s*[•*]\s*/gm, '')
    .replace(/\*{2,}/g, '')
    .replace(/\*([^*\n]+)\*/g, '$1')

    // Remove section headers completely
    .replace(/(📊\s*)?Reports and Research Papers\s*:?\s*$/gm, '')
    .replace(/(📰\s*)?Articles and News\s*:?\s*$/gm, '')
    .replace(/(🏛️\s*)?Government Resources\s*:?\s*$/gm, '')
    .replace(/(🎓\s*)?Academic Sources\s*:?\s*$/gm, '')

    // Fix numbered items with weird line breaks
    .replace(
      /(\d+)\.\s*([A-Z][^\n]*?)\n([A-Z][^\n]*?)\n*:?\s*/g,
      (match, num, part1, part2) => {
        const title = `${part1} ${part2}`.replace(/\s+/g, ' ').trim();
        return `\n${num}. ${title}\n\n`;
      },
    )

    // Fix items split across multiple lines
    .replace(
      /(\d+)\.\s*([^\n:]+)\n([^\n:]+)\n*:?\s*/g,
      (match, num, part1, part2) => {
        const title = `${part1} ${part2}`.replace(/\s+/g, ' ').trim();
        return `\n${num}. ${title}\n\n`;
      },
    )

    // Handle "by Author:" patterns
    .replace(/\n\s*by\s+([^:]+):\s*/gi, '\n\nBy: $1\n\n')

    // Remove closing messages
    .replace(/I hope this information is helpful!\s*$/i, '')

    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/gm, '\n')
    .trim();

  // Apply final smart text processing to the cleaned content
  content = smartTextProcessing(content);

  return { content, sources: limitedSources };
};

// React Markdown Components (keeping your existing components but with improved text handling)
const components: Partial<Components> = {
  code(props) {
    const { className = '', children, ...rest } = props;
    const isInline = (props as any).inline;

    if (isInline) {
      return (
        <code
          className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border font-jetbrains"
          {...rest}
        >
          {children}
        </code>
      );
    }

    const content = String(children).replace(/\n$/, '');

    return (
      <div className="relative group my-4">
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <CopyButton getContent={() => content} />
        </div>
        <pre className="bg-card text-card-foreground p-4 rounded-lg overflow-x-auto border border-border">
          <code
            className={`font-mono text-sm leading-relaxed font-jetbrains ${className}`}
            {...rest}
          >
            {children}
          </code>
        </pre>
      </div>
    );
  },

  p({ children, ...props }) {
    const hasBlockElement = Children.toArray(children).some((child) => {
      if (!isValidElement(child)) return false;
      const type = (child as any).type;
      return (
        ['pre', 'div', 'ul', 'ol', 'blockquote', 'table'].includes(type) ||
        (child as any).props?.className?.includes('group')
      );
    });

    if (hasBlockElement) {
      return <div className="my-1">{children}</div>;
    }

    return (
      <p
        className="text-base leading-relaxed text-foreground my-2 font-article break-words"
        {...props}
      >
        {children}
      </p>
    );
  },

  ul({ children, ...props }) {
    return (
      <ul
        className="list-disc pl-6 my-3 space-y-1 text-base leading-relaxed text-foreground marker:text-primary font-article"
        {...props}
      >
        {children}
      </ul>
    );
  },

  ol({ children, ...props }) {
    return (
      <ol
        className="list-decimal pl-6 my-3 space-y-1 text-base leading-relaxed text-foreground marker:text-primary font-article"
        {...props}
      >
        {children}
      </ol>
    );
  },

  li({ children, ...props }) {
    return (
      <li className="text-base leading-relaxed font-article break-words" {...props}>
        {children}
      </li>
    );
  },

  strong({ children, ...props }) {
    return (
      <strong className="font-semibold text-foreground font-article" {...props}>
        {children}
      </strong>
    );
  },

  em({ children, ...props }) {
    return (
      <em className="italic text-muted-foreground font-article" {...props}>
        {children}
      </em>
    );
  },

  a({ children, href, ...props }) {
    // For web search results, just show the text without making it a link
    return <span className="text-foreground font-article break-words">{children}</span>;
  },

  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2 font-article break-words"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => {
    const content = String(children);

    // Replace emojis with icons
    const getIcon = (text: string) => {
      if (text.includes('📊')) {
        return (
          <svg
            className="inline w-5 h-5 mr-2 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      }
      if (text.includes('📰')) {
        return (
          <svg
            className="inline w-5 h-5 mr-2 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        );
      }
      if (text.includes('🏛️')) {
        return (
          <svg
            className="inline w-5 h-5 mr-2 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      }
      if (text.includes('🎓')) {
        return (
          <svg
            className="inline w-5 h-5 mr-2 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
        );
      }
      return null;
    };

    const cleanText = content
      .replace(/📊/g, '')
      .replace(/📰/g, '')
      .replace(/🏛️/g, '')
      .replace(/🎓/g, '')
      .trim();
    const icon = getIcon(content);

    return (
      <h2
        className="text-2xl font-bold text-foreground mt-5 mb-2 border-b border-border pb-1 flex items-center font-article break-words"
        {...props}
      >
        {icon}
        {cleanText}
      </h2>
    );
  },
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold text-foreground mt-4 mb-2 break-words" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-semibold text-foreground mt-3 mb-2 break-words" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-base font-semibold text-foreground mt-3 mb-1 break-words"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-semibold text-foreground mt-2 mb-1 break-words" {...props}>
      {children}
    </h6>
  ),

  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="border-l-4 border-primary pl-4 py-2 my-3 bg-muted italic text-muted-foreground font-article break-words"
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  hr({ ...props }) {
    return <hr className="border-border my-6" {...props} />;
  },

  table({ children, ...props }) {
    const getTableText = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(getTableText).join('\t');
      if (node.props?.children) return getTableText(node.props.children);
      return '';
    };

    return (
      <div className="relative group my-4 overflow-hidden rounded-lg border border-border bg-card">
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <CopyButton getContent={() => getTableText(children)} />
        </div>
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-border font-table"
            {...props}
          >
            {children}
          </table>
        </div>
      </div>
    );
  },

  thead({ children, ...props }) {
    return (
      <thead className="bg-muted" {...props}>
        {children}
      </thead>
    );
  },

  tbody({ children, ...props }) {
    return (
      <tbody className="bg-card divide-y divide-border" {...props}>
        {children}
      </tbody>
    );
  },

  tr({ children, ...props }) {
    return (
      <tr className="hover:bg-accent/50 transition-colors" {...props}>
        {children}
      </tr>
    );
  },

  th({ children, ...props }) {
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider font-table break-words"
        {...props}
      >
        {children}
      </th>
    );
  },

  td({ children, ...props }) {
    return (
      <td
        className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground font-table break-words"
        {...props}
      >
        {children}
      </td>
    );
  },

  img({ src, alt, ...props }) {
    return (
      <div className="my-4">
        <img
          className="max-w-full h-auto rounded-lg shadow-md border border-border"
          src={src}
          alt={alt || 'Image'}
          loading="lazy"
          {...props}
        />
        {alt && (
          <p className="text-sm text-muted-foreground text-center mt-2 italic">
            {alt}
          </p>
        )}
      </div>
    );
  },
};

const remarkPlugins = [remarkGfm];

// Main Markdown Component
const NonMemoizedMarkdown = ({
  children,
  showSources = true,
}: { children: string; showSources?: boolean }) => {
  if (!children) return null;

  const { content, sources } = formatWebSearchResults(children);

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {content}
      </ReactMarkdown>

      {showSources && sources.length > 0 && (
        <SourcesContainer sources={sources} />
      )}
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prev, next) =>
    prev.children === next.children && prev.showSources === next.showSources,
);

// IMPROVED Typewriter Component with proper streaming and cut-off handling
export function MarkdownTypewriter({
  children,
  speed = 15, // Faster default speed
  isStreaming = false,
  showSources = true,
}: {
  children: string;
  speed?: number;
  isStreaming?: boolean;
  showSources?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const indexRef = useRef(0);
  
  const fullText = children || '';

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!fullText) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    // If not streaming or text is very short, show immediately
    if (!isStreaming || fullText.length < 50) {
      setDisplayedText(fullText);
      setIsComplete(true);
      return;
    }

    // Reset state for new streaming
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    const streamText = () => {
      if (indexRef.current < fullText.length) {
        // Stream by words instead of characters for better performance
        const words = fullText.split(/(\s+)/);
        let wordIndex = 0;
        let currentText = '';
        
        const streamWords = () => {
          if (wordIndex < words.length) {
            currentText += words[wordIndex];
            setDisplayedText(currentText);
            wordIndex++;
            
            // Adjust speed based on word length and type
            let delay = speed;
            const currentWord = words[wordIndex - 1];
            if (currentWord && currentWord.length > 8) delay *= 1.5; // Slower for long words
            if (currentWord && /[.!?]/.test(currentWord)) delay *= 2; // Pause at sentence ends
            
            timeoutRef.current = setTimeout(streamWords, delay);
          } else {
            setIsComplete(true);
          }
        };
        
        streamWords();
      } else {
        setIsComplete(true);
      }
    };

    // Start streaming with a small delay
    timeoutRef.current = setTimeout(streamText, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fullText, speed, isStreaming]);

  // If streaming is complete or not streaming, show full content
  if (isComplete || !isStreaming) {
    return <Markdown showSources={showSources}>{fullText}</Markdown>;
  }

  // While streaming, show partial content with cursor
  return (
    <div className="relative">
      <Markdown showSources={false}>{displayedText}</Markdown>
      {!isComplete && displayedText && (
        <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  );
}