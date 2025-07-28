import type { ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { SidebarLeftIcon } from './icons';
import { Button } from './ui/button';

export function SidebarToggle({
  className,
  ...props
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar, open, isMobile } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
          size={isMobile ? 'sm' : 'default'}
          className={`
            relative overflow-hidden transition-all duration-200 ease-in-out
            ${isMobile ? 'size-8 p-0 rounded-lg' : 'md:px-2 md:h-fit px-3 py-2'}
            hover:bg-accent/80 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            border-border/60 hover:border-border
            ${className}
          `}
          {...props}
        >
          {/* Background animation */}
          <motion.div
            className="absolute inset-0 bg-accent/20"
            initial={false}
            animate={{
              scale: open ? 1 : 0,
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.15 }}
          />

          {/* Icon with rotation animation */}
          <motion.div
            animate={{
              rotate: open ? 180 : 0,
              scale: open ? 0.9 : 1,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
            className="relative z-10"
          >
            <SidebarLeftIcon size={isMobile ? 13 : 14} />
          </motion.div>

          {/* Ripple effect on click */}
          <motion.div
            className="absolute inset-0 rounded-inherit"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 1.2, opacity: 0.1 }}
            transition={{ duration: 0.3 }}
            style={{
              background:
                'radial-gradient(circle, currentColor 50%, transparent 50%)',
            }}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        align="start"
        side={isMobile ? 'bottom' : 'right'}
        className="text-xs"
      >
        {open ? 'Close' : 'Open'} Sidebar
      </TooltipContent>
    </Tooltip>
  );
}
