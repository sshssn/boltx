import Link from 'next/link';
import React, {
  memo,
  useEffect,
  useState,
  Children,
  isValidElement,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@fontsource/jetbrains-mono';

// CopyButton component
function CopyButton({
  getContent,
  className = '',
}: { getContent: () => string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  return (
    <div className="relative inline-block">
      {!showFeedback && (
        <button
          type="button"
          aria-label="Copy to clipboard"
          className={`absolute top-2 right-2 z-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-indigo-500 hover:text-white text-zinc-700 dark:text-zinc-200 rounded p-1.5 text-xs shadow transition ${className}`}
          onClick={async (e) => {
            e.preventDefault();
            try {
              await navigator.clipboard.writeText(getContent());
              setCopied(true);
              setShowFeedback(true);
              setTimeout(() => {
                setCopied(false);
                setShowFeedback(false);
              }, 1200);
            } catch {}
          }}
          // On touch devices, tap triggers copy (no hover needed)
          onTouchStart={async (e) => {
            e.preventDefault();
            try {
              await navigator.clipboard.writeText(getContent());
              setCopied(true);
              setShowFeedback(true);
              setTimeout(() => {
                setCopied(false);
                setShowFeedback(false);
              }, 1200);
            } catch {}
          }}
        >
          {'Copy'}
        </button>
      )}
      {/* Minimal feedback, non-intrusive, a11y-friendly */}
      {showFeedback && (
        <span
          className="absolute right-0 top-8 text-green-500 text-xs bg-white dark:bg-zinc-900 rounded px-2 py-1 shadow border border-green-200 dark:border-green-700 animate-fade-in"
          aria-live="polite"
        >
          ✓ Copied to clipboard
        </span>
      )}
    </div>
  );
}

const components: Partial<Components> = {
  code(props) {
    const { className = '', children, ...rest } = props;
    const isInline = (props as any).inline;
    if (isInline) {
      // Small inline code like `this`
      return (
        <code
          className="text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md font-mono"
          {...rest}
        >
          {children}
        </code>
      );
    }
    // Block code: copy button only on hover
    return (
      <div className="relative group">
        <CopyButton
          getContent={() => String(children).replace(/\n$/, '')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-100"
        />
        <code
          className={`block w-full overflow-x-auto rounded-xl bg-zinc-900 text-zinc-100 p-4 font-['JetBrains_Mono'] text-sm border border-zinc-700 ${className}`}
          {...rest}
        >
          {children}
        </code>
      </div>
    );
  },

  p({ children, ...props }) {
    // If any child is a block element, render all children directly (no <p>)
    const blockTags = ['pre', 'ul', 'ol'];
    if (
      Children.toArray(children).some(
        (child) =>
          isValidElement(child) && blockTags.includes((child as any).type),
      )
    ) {
      return <>{children}</>;
    }
    return (
      <p className="leading-relaxed my-2 text-base" {...props}>
        {children}
      </p>
    );
  },

  ul({ children, ...props }) {
    return (
      <ul
        className="list-disc ml-6 marker:text-indigo-500 space-y-1"
        {...props}
      >
        {children}
      </ul>
    );
  },

  ol({ children, ...props }) {
    return (
      <ol
        className="list-decimal ml-6 marker:text-indigo-500 space-y-1"
        {...props}
      >
        {children}
      </ol>
    );
  },

  li({ children, ...props }) {
    return (
      <li className="pl-1" {...props}>
        {children}
      </li>
    );
  },

  strong({ children, ...props }) {
    return (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    );
  },

  a({ children, href, ...props }) {
    return (
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        href={href || '#'}
        {...props}
      >
        {children}
      </Link>
    );
  },

  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold mt-6 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold mt-6 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-5 mb-1" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-semibold mt-4 mb-1" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-base font-semibold mt-3 mb-1" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-2 mb-1" {...props}>
      {children}
    </h6>
  ),
  table({ children, ...props }) {
    // Extract table text for copy
    function getTableText(node: any): string {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(getTableText).join(' ');
      if (node.props?.children) return getTableText(node.props.children);
      return '';
    }
    return (
      <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <table className="min-w-full text-sm text-left rounded-xl">
          {children}
        </table>
        <div className="flex justify-end p-2">
          <CopyButton
            getContent={() => getTableText(children)}
            className="static top-auto right-auto"
          />
        </div>
      </div>
    );
  },
  thead({ children, ...props }) {
    return <thead className="bg-zinc-100 dark:bg-zinc-800">{children}</thead>;
  },
  tbody({ children, ...props }) {
    return (
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {children}
      </tbody>
    );
  },
  tr({ children, ...props }) {
    return (
      <tr className="even:bg-zinc-50 even:dark:bg-zinc-800/60 hover:bg-indigo-50 hover:dark:bg-indigo-900/30 transition-colors">
        {children}
      </tr>
    );
  },
  th({ children, ...props }) {
    return (
      <th className="px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 first:rounded-tl-xl last:rounded-tr-xl">
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700">
        {children}
      </td>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prev, next) => prev.children === next.children,
);

// MARKDOWN TYPEWRITER

export function MarkdownTypewriter({
  children,
  speed = 40,
  isStreaming = false,
}: {
  children: string;
  speed?: number;
  isStreaming?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  const fullText = children || '';

  useEffect(() => {
    setDisplayedText('');
    setDone(false);
    if (!fullText) return;

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        const next = fullText.slice(0, i + 1);
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          setDone(true);
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [fullText, speed]);

  return (
    <div className="font-['JetBrains_Mono'] text-base leading-relaxed">
      {!done && isStreaming ? (
        <span>
          {displayedText}
          <span className="blinking-cursor">|</span>
          <style>{`.blinking-cursor { animation: blink 1s step-start infinite; } @keyframes blink { 50% { opacity: 0; } }`}</style>
        </span>
      ) : (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
          {fullText}
        </ReactMarkdown>
      )}
    </div>
  );
}
