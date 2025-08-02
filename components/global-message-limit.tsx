'use client';

import { useMessageLimit } from './message-limit-provider';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Brain,
  History,
  X,
  FileText,
  Code,
  Image,
  BarChart3,
  FileSpreadsheet,
  Crown,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';
import Link from 'next/link';

export function GlobalMessageLimit() {
  // Completely disabled - no more limit modals
  return null;
}
