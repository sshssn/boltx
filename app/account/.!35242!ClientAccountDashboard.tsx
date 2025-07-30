'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  User,
  History,
  Bot,
  Key,
  Paperclip,
  MessageCircle,
  Trash2,
  Calendar,
  Clock,
  Receipt,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  ExternalLink,
  Sparkles,
  Sun,
  Copy,
  Image,
  FileText,
  File,
  Lock,
  Database,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/user-avatar';

const tabItems = [
  { id: 'account', label: 'Account', icon: <User size={16} /> },
  { id: 'history', label: 'History & Sync', icon: <History size={16} /> },
  { id: 'memories', label: 'Memories', icon: <Database size={16} /> },
  { id: 'api-keys', label: 'API Keys', icon: <Key size={16} /> },
  { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
  { id: 'billing', label: 'Billing', icon: <Receipt size={16} /> },
  { id: 'contact', label: 'Contact', icon: <MessageCircle size={16} /> },
];

export default function ClientAccountDashboard() {
  const [activeTab, setActiveTab] = useState('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState<number>(0);
  const [messagesLimit, setMessagesLimit] = useState<number>(20);
  const [isGuest, setIsGuest] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | undefined>(
    undefined,
  );
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState<
    string | undefined
  >(undefined);
  const [upgrading, setUpgrading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [deleteAccountConfirmed, setDeleteAccountConfirmed] = useState(false);
  const chatsPerPage = 5;
  const filteredChats = chats.filter((c) =>
    (c.title || 'Untitled Chat')
      .toLowerCase()
      .includes(historySearch.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredChats.length / chatsPerPage),
  );
  const paginatedChats = filteredChats.slice(
    (historyPage - 1) * chatsPerPage,
    historyPage * chatsPerPage,
  );

  const { data: sessionData, status, update: updateSession } = useSession();
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabItems.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;

    if (sessionData?.user) {
      setIsGuest(sessionData.user.type === 'guest');
      if (sessionData.user.username) {
        setUsername(sessionData.user.username);
      }
    } else {
      setIsGuest(true);
    }
  }, [sessionData, status]);

  useEffect(() => {
    if (status === 'loading' || !sessionData?.user) return;

    async function fetchUsage() {
      setUsageLoading(true);
      try {
        const res = await fetch('/api/profile/tokens');
        if (res.ok) {
          const data = await res.json();
          setMessagesUsed(data.tokensUsed ?? 0);
          setMessagesLimit(data.messagesLimit ?? 20);
        } else {
          setMessagesUsed(0);
          setMessagesLimit(20);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
        setMessagesUsed(0);
        setMessagesLimit(20);
      } finally {
        setUsageLoading(false);
      }
    }
    fetchUsage();
  }, [sessionData, status]);

  useEffect(() => {
    if (status === 'loading' || !sessionData?.user) return;

    async function fetchUserPlan() {
      try {
        const res = await fetch('/api/profile/plan');
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    }
    fetchUserPlan();
  }, [sessionData, status]);

  useEffect(() => {
    if (
      activeTab === 'memories' &&
      sessionData?.user &&
      sessionData.user.type === 'regular'
    ) {
      setMemoriesLoading(true);
      fetch('/api/memory').then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setMemories(data.memory || []);
        } else {
          setMemories([]);
        }
        setMemoriesLoading(false);
      });
    }
  }, [activeTab, sessionData]);

  useEffect(() => {
    if (
      activeTab === 'history' &&
      sessionData?.user &&
      (sessionData.user.type === 'regular' ||
        (sessionData.user as any)?.user_type === 'pro')
    ) {
      setChatsLoading(true);
      fetch('/api/chat?limit=50').then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setChats(data.chats || []);
        } else {
          setChats([]);
        }
        setChatsLoading(false);
      });
    }
  }, [activeTab, sessionData]);

  useEffect(() => {
    if (activeTab === 'attachments' && sessionData?.user) {
      setAttachmentsLoading(true);
      fetch('/api/files/upload').then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setAttachments(data.documents || []);
        } else {
          setAttachments([]);
        }
        setAttachmentsLoading(false);
      });
    }
  }, [activeTab, sessionData]);

  useEffect(() => {
    if (activeTab === 'api-keys' && sessionData?.user) {
      setApiKeyLoading(true);
      fetch('/api/profile/api-key').then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setApiKey(data.apiKey || null);
        } else {
          setApiKey(null);
        }
        setApiKeyLoading(false);
      });
    }
  }, [activeTab, sessionData]);

  useEffect(() => {
    if (status === 'loading' || !sessionData?.user) return;

    async function fetchUsername() {
      try {
        const res = await fetch('/api/profile/username');
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || '');
          setLastUsernameChange(
            data.lastChange ? new Date(data.lastChange) : null,
          );
        } else {
          console.error('Failed to fetch username:', res.status);
          if (res.status === 401) {
            toast.error('Authentication required. Please sign in again.');
          } else if (res.status === 404) {
            console.warn('User not found in database');
          } else {
            toast.error('Failed to load username. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error fetching username:', error);
        toast.error('Network error. Please check your connection.');
      }
    }
    fetchUsername();
  }, [sessionData, status]);

  const handleDeleteAccount = async () => {
    if (!deleteAccountConfirmed) {
      toast.error('Please type "Delete my account" to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmed: true,
        }),
      });

      if (res.ok) {
        toast.success(
          'Account deleted successfully. You have been logged out.',
        );
        await signOut({
          callbackUrl: '/',
          redirect: true,
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  };

  const handleUpgradeToPro = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/stripe/generate-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 500 &&
          errorData.message?.includes('STRIPE_SECRET_KEY')
        ) {
          toast.error('Stripe is not configured. Please contact support.');
        } else {
          toast.error('Failed to create checkout session. Please try again.');
        }
        console.error('Failed to create checkout session:', errorData);
      }
    } catch (error) {
      console.error('Error upgrading to Pro:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const getDisplayName = () => {
    if (username) {
      return username;
    }
    if (sessionData?.user?.username) {
      return sessionData.user.username;
    }
    if (sessionData?.user?.email) {
      const email = sessionData.user.email;
      if (email.startsWith('guest-')) {
        return 'Guest User';
      }
      return email.split('@')[0];
    }
    return 'Account';
  };

  const displayName = getDisplayName();
  const messagesRemaining = Math.max(messagesLimit - messagesUsed, 0);
  const usagePercent = Math.min((messagesUsed / messagesLimit) * 100, 100);
  const plan = isGuest
    ? 'Guest'
    : userPlan === 'pro'
      ? 'Pro Plan'
      : 'Free Plan';

  const usernameChangeDisabled =
    !!usernameLoading ||
    (!!lastUsernameChange &&
      Date.now() - lastUsernameChange.getTime() < 1000 * 60 * 60 * 24 * 30);

  const getDaysRemaining = () => {
    if (!lastUsernameChange) return 0;
    const daysElapsed = Math.floor(
      (Date.now() - lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, 30 - daysElapsed);
  };

  const daysRemaining = getDaysRemaining();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please sign in to access your account settings.
          </p>
          <Button onClick={() => router.push('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background text-foreground font-sans overflow-hidden relative">
      {/* Enhanced background patterns with better light mode */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.04),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
      {/* Additional soft blur layers for light mode */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_10%,rgba(168,85,247,0.02),transparent_40%)] dark:hidden pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_60%,rgba(34,197,94,0.02),transparent_40%)] dark:hidden pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_90%,rgba(239,68,68,0.02),transparent_40%)] dark:hidden pointer-events-none" />
      <div className="relative z-10">
        {/* Navigation Layout */}
        <div className="sticky top-0 z-50 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Back Button - Aligned to left like login form */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => router.push('/')}
              >
                ← Back to Chat
              </Button>
            </div>

            {/* Floating Navigation Container */}
            <div className="rounded-xl border border-border/50 bg-white/80 dark:bg-background/50 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-1 p-1">
                {tabItems.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => {
                  const newTheme = document.documentElement.classList.contains(
                    'dark',
                  )
                    ? 'light'
                    : 'dark';
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', newTheme);
                }}
              >
                                        <Sun className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Panel - User Info & Usage */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              {/* Profile Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <UserAvatar
                      email={sessionData?.user?.email}
                      name={displayName}
                      size={80}
                      className="size-20"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {displayName}
                    </h2>
                    {sessionData?.user?.email && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {sessionData.user.email}
                      </p>
                    )}
                    <Badge className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm">
                      {plan}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Message Usage Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-foreground">
                      Message Usage
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Resets today at 4:59 AM
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Standard</span>
                      <span className="text-foreground font-medium">
                        {messagesUsed}/{messagesLimit}
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2 bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      {messagesRemaining} messages remaining
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                                              <div className="size-4 text-muted-foreground mt-0.5">
