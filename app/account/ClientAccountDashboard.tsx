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
  Ticket,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [ticketType, setTicketType] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTicketsLoading, setUserTicketsLoading] = useState(false);
  const [ticketAttachments, setTicketAttachments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsFilter, setTicketsFilter] = useState('all');
  const [ticketsPagination, setTicketsPagination] = useState<any>(null);
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
    if (activeTab === 'contact' && sessionData?.user) {
      setUserTicketsLoading(true);
      const params = new URLSearchParams({
        page: ticketsPage.toString(),
        limit: '10',
        ...(ticketsSearch && { search: ticketsSearch }),
        ...(ticketsFilter && ticketsFilter !== 'all' && { status: ticketsFilter }),
      });

      fetch(`/api/tickets?${params}`).then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUserTickets(data.tickets || []);
          setTicketsPagination(data.pagination);
        } else {
          setUserTickets([]);
          setTicketsPagination(null);
        }
        setUserTicketsLoading(false);
      });
    }
  }, [activeTab, sessionData, ticketsPage, ticketsSearch, ticketsFilter]);

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

  const handleCreateTicket = async () => {
    if (!ticketType || !ticketSubject || !ticketDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingTicket(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: ticketType,
          subject: ticketSubject,
          description: ticketDescription,
          priority: ticketPriority,
          attachments: ticketAttachments,
        }),
      });

      if (response.ok) {
        toast.success('Ticket submitted successfully!');
        // Reset form
        setTicketType('');
        setTicketPriority('medium');
        setTicketSubject('');
        setTicketDescription('');
        setTicketAttachments([]);
        // Refresh tickets list
        setTicketsPage(1);
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
        });
        const ticketsRes = await fetch(`/api/tickets?${params}`);
        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          setUserTickets(data.tickets || []);
          setTicketsPagination(data.pagination);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tickets/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTicketAttachments([...ticketAttachments, data.file]);
        toast.success('File uploaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number) => {
    setTicketAttachments(ticketAttachments.filter((_, i) => i !== index));
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
                        ℹ️
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Each tool call (e.g. search grounding) used in a reply
                        consumes an additional standard credit. Models may not
                        always utilize enabled tools.
                      </p>
                    </div>
                  </div>
                  {isGuest && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive">
                        You are using a guest account. You have 10 messages per
                        day.{' '}
                        <a href="/auth" className="underline font-medium">
                          Sign up
                        </a>{' '}
                        to increase your limit!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyboard Shortcuts Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {[
                    { label: 'Search chats', shortcut: '⌘K' },
                    { label: 'Open new chat', shortcut: '⇧⌘O' },
                    { label: 'Toggle sidebar', shortcut: '⇧⌘S' },
                    { label: 'Copy last code block', shortcut: '⇧⌘;' },
                    { label: 'Next message', shortcut: '⇧↓' },
                    { label: 'Previous message', shortcut: '⇧↑' },
                    { label: 'Delete chat', shortcut: '⇧⌘⌫' },
                    { label: 'Focus chat input', shortcut: '⇧R' },
                    { label: 'Show shortcuts', shortcut: '⌘/' },
                    { label: 'Set custom instructions', shortcut: '⇧⌘I' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground border border-border">
                        {item.shortcut}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Main Content */}
            <div className="flex-1">
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl overflow-hidden shadow-lg">
                {/* Mobile Tabs */}
                <div className="lg:hidden p-4 border-b border-border/50">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex gap-1 overflow-x-auto no-scrollbar w-full bg-muted/50">
                      {tabItems.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:text-primary backdrop-blur-sm"
                        >
                          {tab.icon}
                          <span className="text-xs">{tab.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="p-6 space-y-6">
                    <TabsContent value="account" className="mt-0">
                      <div className="space-y-6">
                        {/* Mini Pricing Design - Replacing bento cards */}
                        {!usageLoading && !isGuest && userPlan !== 'pro' && (
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-6">
                              <div className="text-center">
                                <h4 className="text-lg font-semibold text-foreground mb-2">
                                  Pricing that Scales with You
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Choose the plan that fits your needs
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-5">
                                {/* Free Plan */}
                                <div className="rounded-lg flex flex-col justify-between space-y-4 border border-border/50 p-4 md:col-span-2">
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="font-medium text-foreground">
                                        Free
                                      </h5>
                                      <span className="block text-xl font-semibold text-foreground">
                                        $0 / mo
                                      </span>
                                      <p className="text-muted-foreground text-xs">
                                        Per user
                                      </p>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm"
                                      disabled
                                    >
                                      Current Plan
                                    </Button>

                                    <hr className="border-border/50" />

                                    <ul className="space-y-2 text-xs text-muted-foreground">
                                      {[
                                        '25 messages/day',
                                        '5 file uploads',
                                        'Basic AI models',
                                        'Email support',
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-center gap-2"
                                        >
                                          <Check className="size-3 text-green-500" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Pro Plan */}
                                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-lg md:col-span-3">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-foreground">
                                          Pro
                                        </h5>
                                        <span className="block text-xl font-semibold text-foreground">
                                          $7.99 / mo
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                          Per user
                                        </p>
                                      </div>

                                      <Button
                                        size="sm"
                                        onClick={handleUpgradeToPro}
                                        disabled={upgrading}
                                        className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm"
                                      >
                                        {upgrading ? (
                                          <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            {userPlan === 'pro'
                                              ? 'Manage Plan'
                                              : 'Upgrade to Pro'}
                                          </>
                                        )}
                                      </Button>
                                    </div>

                                    <div>
                                      <div className="text-xs font-medium text-primary/80 mb-2">
                                        Everything in free plus:
                                      </div>
                                      <ul className="space-y-2 text-xs text-muted-foreground">
                                        {[
                                          '1500 messages/month',
                                          '∞ file uploads',
                                          'All AI models',
                                          'Priority support',
                                          'Advanced analytics',
                                          'Custom integrations',
                                        ].map((item) => (
                                          <li
                                            key={item}
                                            className="flex items-center gap-2"
                                          >
                                            <Check className="size-3 text-green-500" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pro User Status - Show when user is Pro */}
                        {!usageLoading && !isGuest && userPlan === 'pro' && (
                          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-6">
                              <div className="text-center">
                                <h4 className="text-lg font-semibold text-foreground mb-2">
                                  Pro Plan Active
                                </h4>
                                <p className="text-sm text-blue-600 dark:text-blue-300">
                                  You have access to all premium features
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    1500
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Messages/day
                                  </div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    ∞
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    File uploads
                                  </div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    All
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    AI models
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3 justify-center">
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    window.open('/api/stripe/portal', '_blank')
                                  }
                                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm"
                                >
                                  <Receipt className="size-4 mr-2" />
                                  Manage Subscription
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    window.open('/api/stripe/portal', '_blank')
                                  }
                                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm"
                                >
                                  <Calendar className="size-4 mr-2" />
                                  Billing History
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Profile Information and Account Settings - Side by Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Profile Information */}
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  Profile Information
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Manage your account details and preferences
                                </p>
                              </div>

                              {/* Username Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">
                                    Username
                                  </span>
                                  {!editingUsername && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingUsername(true)}
                                      disabled={usernameChangeDisabled}
                                      title={
                                        usernameChangeDisabled
                                          ? `You can change your username again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                                          : 'Edit username'
                                      }
                                      className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    >
                                      {usernameChangeDisabled
                                        ? 'Edit (30d)'
                                        : 'Edit'}
                                    </Button>
                                  )}
                                </div>

                                {editingUsername ? (
                                  <div className="space-y-3">
                                    <Input
                                      value={username}
                                      onChange={(e) =>
                                        setUsername(e.target.value)
                                      }
                                      disabled={usernameLoading}
                                      autoFocus
                                      placeholder="Enter username"
                                      className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          setUsernameLoading(true);
                                          setUsernameError('');
                                          setUsernameSuccess('');

                                          if (!username.trim()) {
                                            setUsernameError(
                                              'Username is required.',
                                            );
                                            setUsernameLoading(false);
                                            return;
                                          }

                                          if (
                                            username.length < 3 ||
                                            username.length > 32
                                          ) {
                                            setUsernameError(
                                              'Username must be 3-32 characters.',
                                            );
                                            setUsernameLoading(false);
                                            return;
                                          }

                                          if (
                                            !/^[a-zA-Z0-9_-]+$/.test(username)
                                          ) {
                                            setUsernameError(
                                              'Username can only contain letters, numbers, underscores, and hyphens.',
                                            );
                                            setUsernameLoading(false);
                                            return;
                                          }

                                          try {
                                            const res = await fetch(
                                              '/api/profile/username',
                                              {
                                                method: 'POST',
                                                headers: {
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  username,
                                                }),
                                              },
                                            );

                                            if (res.ok) {
                                              const data = await res.json();
                                              setUsernameSuccess(
                                                'Username updated successfully!',
                                              );
                                              setEditingUsername(false);
                                              toast.success(
                                                'Username updated successfully!',
                                              );
                                              await updateSession();
                                              setTimeout(() => {
                                                window.location.reload();
                                              }, 500);

                                              const refreshRes = await fetch(
                                                '/api/profile/username',
                                              );
                                              if (refreshRes.ok) {
                                                const refreshData =
                                                  await refreshRes.json();
                                                setLastUsernameChange(
                                                  refreshData.lastChange
                                                    ? new Date(
                                                        refreshData.lastChange,
                                                      )
                                                    : null,
                                                );
                                              }
                                            } else {
                                              const data = await res.json();
                                              const errorMessage =
                                                data.error ||
                                                'Failed to update username';
                                              setUsernameError(errorMessage);
                                              toast.error(errorMessage);

                                              if (
                                                data.daysRemaining !== undefined
                                              ) {
                                                const refreshRes = await fetch(
                                                  '/api/profile/username',
                                                );
                                                if (refreshRes.ok) {
                                                  const refreshData =
                                                    await refreshRes.json();
                                                  setLastUsernameChange(
                                                    refreshData.lastChange
                                                      ? new Date(
                                                          refreshData.lastChange,
                                                        )
                                                      : null,
                                                  );
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error(
                                              'Error updating username:',
                                              error,
                                            );
                                            const errorMessage =
                                              'Network error. Please try again.';
                                            setUsernameError(errorMessage);
                                            toast.error(errorMessage);
                                          }

                                          setUsernameLoading(false);
                                        }}
                                        disabled={usernameChangeDisabled}
                                        className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm"
                                      >
                                        {usernameLoading ? 'Saving...' : 'Save'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingUsername(false);
                                          setUsername(username || '');
                                          setUsernameError('');
                                          setUsernameSuccess('');
                                        }}
                                        disabled={usernameLoading}
                                        className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="font-mono text-foreground text-sm">
                                      {username || (
                                        <span className="text-muted-foreground">
                                          No username set • Using email as
                                          display name
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  Choose a unique username. This helps the AI
                                  address you personally and improves your chat
                                  experience.
                                  {!username &&
                                    ' Currently using your email as your display name.'}
                                </p>

                                {usernameChangeDisabled &&
                                  daysRemaining > 0 && (
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <p className="text-sm text-amber-600 dark:text-amber-400">
                                        ⏰ Username can only be changed once per
                                        month. You can change it again in{' '}
                                        {daysRemaining} day
                                        {daysRemaining !== 1 ? 's' : ''}.
                                      </p>
                                    </div>
                                  )}

                                {usernameError && (
                                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <p className="text-sm text-destructive">
                                      {usernameError}
                                    </p>
                                  </div>
                                )}

                                {usernameSuccess && (
                                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                      {usernameSuccess}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Account Settings */}
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  Account Settings
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Manage your account actions
                                </p>
                              </div>

                              <div className="space-y-4">
                                {/* Data Retention Warning */}
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <div className="flex items-start gap-3">
                                    <div className="size-2 bg-amber-500 rounded-full mt-2" />
                                    <div>
                                      <h5 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                                        Data Retention Policy
                                      </h5>
                                      <div className="text-xs text-amber-600/80 dark:text-amber-300/80 space-y-1">
                                        <p>
                                          • We do not retain any copies of your
                                          data after account deletion
                                        </p>
                                        <p>
                                          • Deletion is permanent and
                                          irreversible - no recovery possible
                                        </p>
                                        <p>
                                          • All data is permanently removed from
                                          our servers within 30 days
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delete Account Section */}
                        <div className="border-t border-border pt-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                disabled={deleting}
                                className="w-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive hover:text-destructive/80 backdrop-blur-sm"
                              >
                                <AlertTriangle className="size-4 mr-2" />
                                {deleting ? 'Deleting...' : 'Delete Account'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-background border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  Delete this account?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This action cannot be undone. This will
                                  permanently delete:
                                  <br />• All your chats and messages
                                  <br />• All your memories
                                  <br />• All your files and attachments
                                  <br />• Your account data
                                  <br />
                                  <br />
                                  To confirm deletion, please type{' '}
                                  <strong>&quot;Delete my account&quot;</strong>{' '}
                                  below:
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="space-y-4">
                                <Input
                                  placeholder="Type 'Delete my account' to confirm"
                                  value={deleteAccountInput}
                                  onChange={(e) => {
                                    setDeleteAccountInput(e.target.value);
                                    setDeleteAccountConfirmed(
                                      e.target.value === 'Delete my account',
                                    );
                                  }}
                                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                                {deleteAccountInput &&
                                  !deleteAccountConfirmed && (
                                    <p className="text-sm text-destructive">
                                      Please type exactly &quot;Delete my
                                      account&quot; to confirm
                                    </p>
                                  )}
                              </div>

                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  className="bg-muted text-muted-foreground hover:bg-muted/80"
                                  onClick={() => {
                                    setDeleteAccountInput('');
                                    setDeleteAccountConfirmed(false);
                                  }}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                  disabled={deleting || !deleteAccountConfirmed}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting ? 'Deleting...' : 'Delete Account'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Other tabs - simplified for now */}
                    <TabsContent value="memories" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            AI Memories
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Your AI assistant remembers important information
                            from your conversations to provide better context in
                            future chats.
                          </p>
                        </div>

                        {memoriesLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-zinc-400" />
                            <span className="ml-2 text-zinc-400">
                              Loading memories...
                            </span>
                          </div>
                        ) : memories.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="size-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Database className="size-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              No memories yet
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Your AI assistant will start remembering important
                              information as you chat.
                            </p>
                            <Button
                              onClick={() => router.push('/')}
                              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 backdrop-blur-sm"
                            >
                              Start a new chat
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {memories.map((memory) => (
                              <div
                                key={memory.id}
                                className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm text-white leading-relaxed">
                                      {memory.content}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-2">
                                      {new Date(
                                        memory.createdAt,
                                      ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 ml-2"
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-background border-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">
                                          Delete memory?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">
                                          This will permanently delete this
                                          memory. The AI will no longer remember
                                          this information.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                `/api/memory?id=${memory.id}`,
                                                {
                                                  method: 'DELETE',
                                                },
                                              );
                                              if (res.ok) {
                                                setMemories(
                                                  memories.filter(
                                                    (m) => m.id !== memory.id,
                                                  ),
                                                );
                                                toast.success(
                                                  'Memory deleted successfully',
                                                );
                                              } else {
                                                toast.error(
                                                  'Failed to delete memory',
                                                );
                                              }
                                            } catch (error) {
                                              console.error(
                                                'Error deleting memory:',
                                                error,
                                              );
                                              toast.error(
                                                'Failed to delete memory',
                                              );
                                            }
                                          }}
                                          className="bg-red-600 text-white hover:bg-red-700"
                                        >
                                          Delete Memory
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Chat History
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            View and manage your conversation history. You can
                            search, view, and delete chats.
                          </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <Input
                            placeholder="Search your threads"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="bg-white/90 dark:bg-zinc-800/50 border border-border/50 text-foreground placeholder:text-muted-foreground pl-10 rounded-lg"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <svg
                              className="size-4 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {chatsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading chats...
                            </span>
                          </div>
                        ) : filteredChats.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="size-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <History className="size-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              {historySearch
                                ? 'No chats found'
                                : 'No chat history'}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {historySearch
                                ? 'Try adjusting your search terms'
                                : 'Start a conversation to see your chat history here.'}
                            </p>
                            {!historySearch && (
                              <Button
                                onClick={() => router.push('/')}
                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 backdrop-blur-sm"
                              >
                                Start a new chat
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {paginatedChats.map((chat) => (
                              <div
                                key={chat.id}
                                className="rounded-lg border border-border/50 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl p-4 hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          router.push(`/chat/${chat.id}`)
                                        }
                                        className="text-left p-0 h-auto hover:bg-transparent"
                                      >
                                        <h4 className="text-sm font-medium text-foreground truncate">
                                          {chat.title || 'Untitled Chat'}
                                        </h4>
                                      </Button>
                                      <Badge
                                        variant={
                                          chat.visibility === 'public'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {chat.visibility}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(
                                        chat.createdAt,
                                      ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        router.push(`/chat/${chat.id}`)
                                      }
                                      className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    >
                                      <ExternalLink className="size-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="size-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-background border-border">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-foreground">
                                            Delete chat?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className="text-muted-foreground">
                                            This will permanently delete &quot;
                                            {chat.title || 'Untitled Chat'}
                                            &quot; and all its messages. This
                                            action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(
                                                  `/api/chat/${chat.id}`,
                                                  {
                                                    method: 'DELETE',
                                                  },
                                                );
                                                if (res.ok) {
                                                  setChats(
                                                    chats.filter(
                                                      (c) => c.id !== chat.id,
                                                    ),
                                                  );
                                                  toast.success(
                                                    'Chat deleted successfully',
                                                  );
                                                } else {
                                                  toast.error(
                                                    'Failed to delete chat',
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  'Error deleting chat:',
                                                  error,
                                                );
                                                toast.error(
                                                  'Failed to delete chat',
                                                );
                                              }
                                            }}
                                            className="bg-red-600 text-white hover:bg-red-700"
                                          >
                                            Delete Chat
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between pt-4">
                                <p className="text-sm text-zinc-400">
                                  Showing {(historyPage - 1) * chatsPerPage + 1}{' '}
                                  to{' '}
                                  {Math.min(
                                    historyPage * chatsPerPage,
                                    filteredChats.length,
                                  )}{' '}
                                  of {filteredChats.length} chats
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setHistoryPage(
                                        Math.max(1, historyPage - 1),
                                      )
                                    }
                                    disabled={historyPage === 1}
                                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-sm text-zinc-400">
                                    {historyPage} of {totalPages}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setHistoryPage(
                                        Math.min(totalPages, historyPage + 1),
                                      )
                                    }
                                    disabled={historyPage === totalPages}
                                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="api-keys" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            API Keys
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Bring your own API keys for select models
                          </p>
                        </div>

                        {/* Locked Coming Soon Container */}
                        <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl p-12 relative overflow-hidden">
                          {/* Frost glass effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm" />
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 to-zinc-800/20" />

                          <div className="relative z-10 text-center space-y-6">
                            <div className="size-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto border border-border/50">
                              <Lock className="size-10 text-muted-foreground" />
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xl font-semibold text-foreground">
                                Coming Soon
                              </h4>
                              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                We&apos;re working on bringing you the ability
                                to use your own API keys for enhanced model
                                access and customization.
                              </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <div className="size-2 bg-muted-foreground rounded-full" />
                              <span>Feature in development</span>
                              <div className="size-2 bg-muted-foreground rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            File Attachments
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Manage files you&apos;ve uploaded for AI analysis.
                            These files are used to provide context in your
                            conversations.
                          </p>
                        </div>

                        {attachmentsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading attachments...
                            </span>
                          </div>
                        ) : attachments.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="size-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Paperclip className="size-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              No attachments yet
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Upload files in your chats to see them listed
                              here.
                            </p>
                            <Button
                              onClick={() => router.push('/')}
                              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 backdrop-blur-sm"
                            >
                              Start a new chat
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {attachments.map((attachment) => (
                              <div
                                key={`${attachment.id}-${attachment.createdAt}`}
                                className="rounded-lg border border-border/50 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="size-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                                      {attachment.kind === 'image' ? (
                                        <Image className="size-5 text-muted-foreground" />
                                      ) : attachment.kind === 'code' ? (
                                        <FileText className="size-5 text-muted-foreground" />
                                      ) : (
                                        <File className="size-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-foreground truncate">
                                        {attachment.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        {attachment.kind} •{' '}
                                        {new Date(
                                          attachment.createdAt,
                                        ).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        // Open file preview or download
                                        if (attachment.content) {
                                          const blob = new Blob(
                                            [attachment.content],
                                            { type: 'text/plain' },
                                          );
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = attachment.title;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                      className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                    >
                                      <ExternalLink className="size-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="size-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-background border-border">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-foreground">
                                            Delete attachment?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className="text-muted-foreground">
                                            This will permanently delete &quot;
                                            {attachment.title}&quot;. This
                                            action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(
                                                  `/api/document?id=${attachment.id}&timestamp=${attachment.createdAt}`,
                                                  {
                                                    method: 'DELETE',
                                                  },
                                                );
                                                if (res.ok) {
                                                  setAttachments(
                                                    attachments.filter(
                                                      (a) =>
                                                        !(
                                                          a.id ===
                                                            attachment.id &&
                                                          a.createdAt ===
                                                            attachment.createdAt
                                                        ),
                                                    ),
                                                  );
                                                  toast.success(
                                                    'Attachment deleted successfully',
                                                  );
                                                } else {
                                                  toast.error(
                                                    'Failed to delete attachment',
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  'Error deleting attachment:',
                                                  error,
                                                );
                                                toast.error(
                                                  'Failed to delete attachment',
                                                );
                                              }
                                            }}
                                            className="bg-red-600 text-white hover:bg-red-700"
                                          >
                                            Delete Attachment
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Billing & Subscription
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Manage your subscription, view billing history, and
                            upgrade your plan.
                          </p>
                        </div>

                        {/* Mini Pricing Design - Only show for Free users */}
                        {plan === 'Free Plan' && !isGuest && (
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-xl p-6">
                            <div className="space-y-6">
                              <div className="text-center">
                                <h4 className="text-lg font-semibold text-foreground mb-2">
                                  Pricing that Scales with You
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Choose the plan that fits your needs
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-5">
                                {/* Free Plan */}
                                <div className="rounded-lg flex flex-col justify-between space-y-4 border border-border/50 p-4 md:col-span-2">
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="font-medium text-foreground">
                                        Free
                                      </h5>
                                      <span className="block text-xl font-semibold text-foreground">
                                        $0 / mo
                                      </span>
                                      <p className="text-muted-foreground text-xs">
                                        Per user
                                      </p>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 backdrop-blur-sm"
                                      disabled
                                    >
                                      Current Plan
                                    </Button>

                                    <hr className="border-border/50" />

                                    <ul className="space-y-2 text-xs text-muted-foreground">
                                      {[
                                        '25 messages/day',
                                        '5 file uploads',
                                        'Basic AI models',
                                        'Email support',
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-center gap-2"
                                        >
                                          <Check className="size-3 text-green-500" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Pro Plan */}
                                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 shadow-lg md:col-span-3">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-foreground">
                                          Pro
                                        </h5>
                                        <span className="block text-xl font-semibold text-foreground">
                                          $7.99 / mo
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                          Per user
                                        </p>
                                      </div>

                                      <Button
                                        size="sm"
                                        onClick={handleUpgradeToPro}
                                        disabled={upgrading}
                                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 backdrop-blur-sm"
                                      >
                                        {upgrading ? (
                                          <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            {userPlan === 'pro'
                                              ? 'Manage Plan'
                                              : 'Upgrade to Pro'}
                                          </>
                                        )}
                                      </Button>
                                    </div>

                                    <div>
                                      <div className="text-xs font-medium text-blue-300 mb-2">
                                        Everything in free plus:
                                      </div>
                                      <ul className="space-y-2 text-xs text-zinc-300">
                                        {[
                                          '1500 messages/month',
                                          '∞ file uploads',
                                          'All AI models',
                                          'Priority support',
                                          'Advanced analytics',
                                          'Custom integrations',
                                        ].map((item) => (
                                          <li
                                            key={item}
                                            className="flex items-center gap-2"
                                          >
                                            <Check className="size-3 text-green-400" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pro User Status - Show when user is Pro */}
                        {!usageLoading && !isGuest && userPlan === 'pro' && (
                          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-6">
                              <div className="text-center">
                                <h4 className="text-lg font-semibold text-foreground mb-2">
                                  Pro Plan Active
                                </h4>
                                <p className="text-sm text-blue-600 dark:text-blue-300">
                                  You have access to all premium features
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    1500
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Messages/day
                                  </div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    ∞
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    File uploads
                                  </div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                                  <div className="text-2xl font-bold text-foreground">
                                    All
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    AI models
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3 justify-center">
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    window.open('/api/stripe/portal', '_blank')
                                  }
                                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm"
                                >
                                  <Receipt className="size-4 mr-2" />
                                  Manage Subscription
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    window.open('/api/stripe/portal', '_blank')
                                  }
                                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm"
                                >
                                  <Calendar className="size-4 mr-2" />
                                  Billing History
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Usage Statistics */}
                        <div className="rounded-xl border border-border/50 bg-white/70 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                          <div className="space-y-4">
                            <h4 className="text-md font-semibold text-foreground">
                              Usage This Month
                            </h4>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Messages Used
                                </span>
                                <span className="text-sm text-foreground font-medium">
                                  {messagesUsed} / {messagesLimit}
                                </span>
                              </div>
                              <Progress
                                value={usagePercent}
                                className="h-2 bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">
                                Resets daily at 4:59 AM UTC
                              </p>
                            </div>

                            {userPlan === 'pro' && (
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <p className="text-xs text-primary/80">
                                  💡 Pro tip: You can purchase additional
                                  message credits for $8 per 100 messages if you
                                  exceed your monthly limit.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contact" className="mt-0">
                      <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Contact & Support
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Get help, report issues, or contact our support
                            team.
                          </p>
                        </div>

                        {/* Create Support Ticket */}
                        <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-lg font-semibold text-foreground mb-2">
                                Create Support Ticket
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Submit a ticket for bug reports, feature
                                requests, or general support.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label
                                    htmlFor="ticket-type"
                                    className="text-sm font-medium text-foreground mb-2 block"
                                  >
                                    Ticket Type
                                  </label>
                                  <Select
                                    value={ticketType}
                                    onValueChange={setTicketType}
                                  >
                                    <SelectTrigger id="ticket-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bug">
                                        Bug Report
                                      </SelectItem>
                                      <SelectItem value="feature">
                                        Feature Request
                                      </SelectItem>
                                      <SelectItem value="support">
                                        Support
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label
                                    htmlFor="ticket-priority"
                                    className="text-sm font-medium text-foreground mb-2 block"
                                  >
                                    Priority
                                  </label>
                                  <Select
                                    value={ticketPriority}
                                    onValueChange={setTicketPriority}
                                  >
                                    <SelectTrigger id="ticket-priority">
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">
                                        Medium
                                      </SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="urgent">
                                        Urgent
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <label
                                  htmlFor="ticket-subject"
                                  className="text-sm font-medium text-foreground mb-2 block"
                                >
                                  Subject
                                </label>
                                <Input
                                  id="ticket-subject"
                                  placeholder="Brief description of your issue or request"
                                  value={ticketSubject}
                                  onChange={(e) =>
                                    setTicketSubject(e.target.value)
                                  }
                                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="ticket-description"
                                  className="text-sm font-medium text-foreground mb-2 block"
                                >
                                  Description
                                </label>
                                <Textarea
                                  id="ticket-description"
                                  placeholder="Please provide detailed information about your issue or feature request..."
                                  value={ticketDescription}
                                  onChange={(e) =>
                                    setTicketDescription(e.target.value)
                                  }
                                  rows={4}
                                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                              </div>

                              {/* File Attachments */}
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Attachments (Optional)
                                </label>
                                <div className="space-y-3">
                                  {/* File Upload */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="file"
                                      id="file-upload"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFileUpload(file);
                                        }
                                      }}
                                      accept="image/*,.pdf,.txt,.json,.csv,.xlsx,.xls,.docx,.doc"
                                    />
                                    <label
                                      htmlFor="file-upload"
                                      className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                                      aria-label="Upload file for ticket attachment"
                                    >
                                      <Paperclip className="size-4" />
                                      <span className="text-sm">
                                        Choose File
                                      </span>
                                    </label>
                                    {uploadingFile && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Uploading...
                                      </div>
                                    )}
                                  </div>

                                  {/* Attachments List */}
                                  {ticketAttachments.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted-foreground">
                                        Attached files:
                                      </p>
                                      {ticketAttachments.map(
                                        (attachment, index) => (
                                          <div
                                            key={`${attachment.name}-${attachment.size}-${index}`}
                                            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Paperclip className="size-3 text-muted-foreground" />
                                              <span className="text-sm text-foreground">
                                                {attachment.name}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                (
                                                {(
                                                  attachment.size / 1024
                                                ).toFixed(1)}{' '}
                                                KB)
                                              </span>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                removeAttachment(index)
                                              }
                                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            >
                                              <Trash2 className="size-3" />
                                            </Button>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                onClick={handleCreateTicket}
                                disabled={
                                  !ticketType ||
                                  !ticketSubject ||
                                  !ticketDescription ||
                                  creatingTicket
                                }
                                className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary/80 backdrop-blur-sm"
                              >
                                {creatingTicket ? (
                                  <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Creating Ticket...
                                  </>
                                ) : (
                                  <>
                                    <Ticket className="size-4 mr-2" />
                                    Submit Ticket
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* My Tickets */}
                        <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-foreground mb-2">
                                  My Support Tickets
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  View the status of your submitted tickets.
                                </p>
                              </div>
                              {ticketsPagination && (
                                <div className="text-sm text-muted-foreground">
                                  {ticketsPagination.totalCount} total tickets
                                </div>
                              )}
                            </div>

                            {/* Search and Filter */}
                            <div className="flex gap-3">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="Search tickets..."
                                  value={ticketsSearch}
                                  onChange={(e) =>
                                    setTicketsSearch(e.target.value)
                                  }
                                  className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                              </div>
                              <Select
                                value={ticketsFilter}
                                onValueChange={setTicketsFilter}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Status</SelectItem>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">
                                    In Progress
                                  </SelectItem>
                                  <SelectItem value="resolved">
                                    Resolved
                                  </SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {userTicketsLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">
                                  Loading tickets...
                                </span>
                              </div>
                            ) : userTickets.length === 0 ? (
                              <div className="text-center py-8">
                                <Ticket className="size-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  {ticketsSearch || (ticketsFilter && ticketsFilter !== 'all')
                                    ? 'No tickets found matching your criteria.'
                                    : 'No tickets submitted yet.'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {userTickets.map((ticket) => (
                                  <div
                                    key={ticket.id}
                                    className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant={
                                            ticket.type === 'bug'
                                              ? 'destructive'
                                              : ticket.type === 'feature'
                                                ? 'default'
                                                : 'secondary'
                                          }
                                        >
                                          {ticket.type}
                                        </Badge>
                                        <Badge
                                          variant={
                                            ticket.priority === 'urgent'
                                              ? 'destructive'
                                              : ticket.priority === 'high'
                                                ? 'default'
                                                : 'secondary'
                                          }
                                        >
                                          {ticket.priority}
                                        </Badge>
                                        <Badge
                                          variant={
                                            ticket.status === 'open'
                                              ? 'default'
                                              : ticket.status === 'in_progress'
                                                ? 'secondary'
                                                : 'outline'
                                          }
                                        >
                                          {ticket.status}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(
                                          ticket.createdAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <h5 className="font-medium text-foreground mb-2">
                                      {ticket.subject}
                                    </h5>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                      {ticket.description}
                                    </p>

                                    {/* Attachments */}
                                    {ticket.attachments &&
                                      ticket.attachments.length > 0 && (
                                        <div className="space-y-2">
                                          <p className="text-xs text-muted-foreground">
                                            Attachments:
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {ticket.attachments.map(
                                              (
                                                attachment: any,
                                                index: number,
                                              ) => (
                                                <div
                                                  key={`${attachment.name}-${attachment.size}-${index}`}
                                                  className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs"
                                                >
                                                  <Paperclip className="size-3" />
                                                  <span className="truncate max-w-20">
                                                    {attachment.name}
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Pagination */}
                            {ticketsPagination &&
                              ticketsPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                  <p className="text-sm text-muted-foreground">
                                    Showing{' '}
                                    {(ticketsPage - 1) *
                                      ticketsPagination.limit +
                                      1}{' '}
                                    to{' '}
                                    {Math.min(
                                      ticketsPage * ticketsPagination.limit,
                                      ticketsPagination.totalCount,
                                    )}{' '}
                                    of {ticketsPagination.totalCount} tickets
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setTicketsPage(
                                          Math.max(1, ticketsPage - 1),
                                        )
                                      }
                                      disabled={!ticketsPagination.hasPrevPage}
                                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    >
                                      Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                      {ticketsPage} of{' '}
                                      {ticketsPagination.totalPages}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setTicketsPage(
                                          Math.min(
                                            ticketsPagination.totalPages,
                                            ticketsPage + 1,
                                          ),
                                        )
                                      }
                                      disabled={!ticketsPagination.hasNextPage}
                                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Support Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Documentation */}
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-4">
                              <div className="size-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg
                                  className="size-6 text-blue-600 dark:text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-md font-semibold text-foreground mb-2">
                                  Documentation
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Learn how to use boltX effectively with our
                                  comprehensive guides and tutorials.
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() => window.open('/docs', '_blank')}
                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm w-full"
                              >
                                <ExternalLink className="size-4 mr-2" />
                                View Documentation
                              </Button>
                            </div>
                          </div>

                          {/* FAQ */}
                          <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                            <div className="space-y-4">
                              <div className="size-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <svg
                                  className="size-6 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-md font-semibold text-foreground mb-2">
                                  Frequently Asked Questions
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Find quick answers to common questions about
                                  boltX features and usage.
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() => router.push('/faq')}
                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm w-full"
                              >
                                <MessageCircle className="size-4 mr-2" />
                                Browse FAQ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
