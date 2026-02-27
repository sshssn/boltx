import Link from 'next/link';
import React, { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import '@fontsource/jetbrains-mono';
import { motion, AnimatePresence } from 'framer-motion';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
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
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

// Typewriter effect for markdown (for AI responses)
export function MarkdownTypewriter({
  children,
  speed = 120,
  isStreaming,
}: { children: string; speed?: number; isStreaming?: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  const fullText = children || '';

  useEffect(() => {
    setDone(false);
    setDisplayedText('');
    if (!fullText) return;
    let lastText = '';
    let timeout: NodeJS.Timeout;
    function update() {
      if (lastText !== fullText) {
        setDisplayedText(fullText);
        lastText = fullText;
        timeout = setTimeout(update, 50); // Debounce for smoothness
      } else {
        setDone(true);
      }
    }
    update();
    return () => clearTimeout(timeout);
  }, [fullText]);

  if (!done) {
    return (
      <span className="font-['JetBrains_Mono'] text-base">
        {displayedText}
        <span className="blinking-cursor">|</span>
        <style>{`.blinking-cursor { animation: blink 1s step-start infinite; } @keyframes blink { 50% { opacity: 0; } }`}</style>
      </span>
    );
  }
  return (
    <div className="font-['JetBrains_Mono'] text-base">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {fullText}
      </ReactMarkdown>
    </div>
  );
}
