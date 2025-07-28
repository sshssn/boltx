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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  { id: 'memories', label: 'Memories', icon: <Bot size={16} /> },
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
      // Set username from session if available
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

  // Fetch user plan from database
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

  // Fetch attachments when attachments tab is active
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

  // Fetch API key when API Keys tab is active
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

  // Fetch username and last username change timestamp
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Focus input (implement as needed)
        document
          .querySelector('[data-global-search="true"]')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        // Toggle sidebar (implement as needed)
        document
          .querySelector('[aria-label="Toggle sidebar"]')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        // Theme toggle (implement as needed)
        document
          .querySelector('[aria-label="Toggle theme"]')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        // Previous chat (implement as needed)
        console.log('Previous chat');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        // Next chat (implement as needed)
        console.log('Next chat');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        // Sign out and redirect to homepage
        await signOut({
          callbackUrl: '/',
          redirect: true,
        });
      } else {
        console.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
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

  // Create a unique display name that shows username or a formatted email
  const getDisplayName = () => {
    // First check if we have a username from the API (most up-to-date)
    if (username) {
      return username;
    }
    // Fallback to session username
    if (sessionData?.user?.username) {
      return sessionData.user.username;
    }
    if (sessionData?.user?.email) {
      // For guest users or users without username, show a formatted version
      const email = sessionData.user.email;
      if (email.startsWith('guest-')) {
        return 'Guest User';
      }
      // For regular emails, show the part before @
      return email.split('@')[0];
    }
    return 'Account';
  };

  const displayName = getDisplayName();
  const messagesRemaining = Math.max(messagesLimit - messagesUsed, 0);
  const usagePercent = Math.min((messagesUsed / messagesLimit) * 100, 100);
  // Use plan from database
  const plan = isGuest
    ? 'Guest'
    : userPlan === 'pro'
      ? 'Pro Plan'
      : 'Free Plan';

  const usernameChangeDisabled =
    !!usernameLoading ||
    (!!lastUsernameChange &&
      Date.now() - lastUsernameChange.getTime() < 1000 * 60 * 60 * 24 * 30);

  // Calculate days remaining for username change
  const getDaysRemaining = () => {
    if (!lastUsernameChange) return 0;
    const daysElapsed = Math.floor(
      (Date.now() - lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, 30 - daysElapsed);
  };

  const daysRemaining = getDaysRemaining();

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="outline"
          size="sm"
          className="px-4 py-2"
          onClick={() => router.push('/')}
        >
          ← Back to Chat
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
            {/* Profile Card */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <UserAvatar
                    email={sessionData?.user?.email}
                    name={displayName}
                    size={80}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground mb-1">
                    {displayName}
                  </h2>
                  {sessionData?.user?.email && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {sessionData.user.email}
                    </p>
                  )}
                  <Badge variant="secondary">{plan}</Badge>
                </div>
              </div>
            </div>

            {/* Usage Card */}
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Message Usage
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Resets daily at 12:00am
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard</span>
                    <span className="text-card-foreground font-medium">
                      {messagesUsed}/{messagesLimit}
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {messagesRemaining} messages remaining
                  </p>
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

            {/* Upgrade to Pro CTA */}
            {!usageLoading && !isGuest && plan === 'Free Plan' && (
              <div className="rounded-lg border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-card-foreground">
                        Upgrade to Pro
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        25x more messages, advanced AI models
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpgradeToPro}
                    disabled={upgrading}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="w-3 h-3 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    30-day free trial • Cancel anytime
                  </p>
                </div>
              </div>
            )}

            {/* Pro Plan Status */}
            {!usageLoading && plan === 'Pro Plan' && (
              <div className="rounded-lg border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-card-foreground">
                        Pro Plan Active
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Access to all premium features
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('billing')}
                  >
                    Manage Billing
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Shortcuts Card */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {[
                  { label: 'New Thread', shortcut: '⌘ N' },
                  { label: 'Focus Input', shortcut: '⌘ K' },
                  { label: 'Toggle Sidebar', shortcut: '⌘ B' },
                  { label: 'Toggle Theme', shortcut: '⌘ J' },
                  { label: 'Copy Last Message', shortcut: '⌘ C' },
                  { label: 'Regenerate Response', shortcut: '⌘ R' },
                  { label: 'Stop Generation', shortcut: '⌘ S' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground border">
                      {item.shortcut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
            <div className="rounded-lg border bg-card overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="p-6 border-b">
                  <TabsList className="flex gap-2 overflow-x-auto no-scrollbar">
                    {tabItems.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <div className="p-6 space-y-8">
                  <TabsContent value="account" className="mt-0">
                    <div className="space-y-6">
                      {/* Profile Information */}
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Profile Information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Manage your account details and preferences
                            </p>
                          </div>

                          {/* Username Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">
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
                                  onChange={(e) => setUsername(e.target.value)}
                                  disabled={usernameLoading}
                                  autoFocus
                                  placeholder="Enter username"
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

                                      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
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
                                            body: JSON.stringify({ username }),
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

                                          // Force a session refresh by updating the session data
                                          await updateSession();

                                          // Force a page refresh to ensure all components get updated session
                                          setTimeout(() => {
                                            window.location.reload();
                                          }, 500);

                                          // Refresh the last change timestamp
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

                                          // If the API returns days remaining, update the local state
                                          if (
                                            data.daysRemaining !== undefined
                                          ) {
                                            // This will trigger a re-fetch of the username data
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
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-muted border">
                                <span className="font-mono text-card-foreground">
                                  {username || (
                                    <span className="text-muted-foreground">
                                      No username set • Using email as display
                                      name
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-white/60">
                              Choose a unique username. This helps the AI
                              address you personally and improves your chat
                              experience.
                              {!username &&
                                ' Currently using your email as your display name.'}
                            </p>

                            {usernameChangeDisabled && daysRemaining > 0 && (
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
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Account Settings
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Manage your account actions
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Button
                                onClick={handleSignOut}
                                className="w-full"
                              >
                                Sign Out
                              </Button>
                            </div>

                            <div className="border-t pt-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    disabled={deleting}
                                    className="w-full"
                                  >
                                    {deleting
                                      ? 'Deleting...'
                                      : 'Delete Account'}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete this account?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete:
                                      <br />• All your chats and messages
                                      <br />• All your memories
                                      <br />• All your files and attachments
                                      <br />• Your account data
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteAccount}
                                      disabled={deleting}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleting
                                        ? 'Deleting...'
                                        : 'Delete Account'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="memories" className="mt-0">
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Memories
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Your unique AI memories
                            </p>
                          </div>

                          {memoriesLoading ? (
                            <div className="text-sm text-muted-foreground">
                              Loading...
                            </div>
                          ) : memories.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              No memories found for your account.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {memories.map((m) => (
                                <div
                                  key={m.id}
                                  className="relative group rounded-lg p-4 bg-muted/50 border transition-all duration-200 hover:scale-[1.02] hover:bg-muted"
                                >
                                  <span
                                    className="font-mono text-sm text-card-foreground break-words select-text"
                                    style={{
                                      fontFamily: 'JetBrains Mono, monospace',
                                    }}
                                  >
                                    {m.content}
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-2 block">
                                    {new Date(m.createdAt).toLocaleString()}
                                  </span>
                                  <AlertDialog
                                    open={deleteDialogOpen === m.id}
                                    onOpenChange={(open) =>
                                      setDeleteDialogOpen(
                                        open ? m.id : undefined,
                                      )
                                    }
                                  >
                                    <AlertDialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-full p-1.5 shadow border border-destructive/30"
                                        title="Delete memory"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 20 20"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete this memory?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. Are you
                                          sure you want to delete this memory?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={async () => {
                                            await fetch(
                                              `/api/memory?id=${m.id}`,
                                              {
                                                method: 'DELETE',
                                              },
                                            );
                                            setMemories((prev) =>
                                              prev.filter((x) => x.id !== m.id),
                                            );
                                            setDeleteDialogOpen(undefined);
                                          }}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="history" className="mt-0">
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Chat History
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Manage your conversation history and sync settings
                            </p>
                          </div>

                          <div className="mb-4 flex flex-row gap-2 items-center">
                            <Input
                              type="text"
                              placeholder="Search chats..."
                              value={historySearch}
                              onChange={(e) => {
                                setHistorySearch(e.target.value);
                                setHistoryPage(1);
                              }}
                              className="w-64"
                            />
                            <span className="ml-auto text-xs text-muted-foreground">
                              Page {historyPage} of {totalPages}
                            </span>
                          </div>

                          {chatsLoading ? (
                            <div className="text-sm text-muted-foreground">
                              Loading...
                            </div>
                          ) : !sessionData?.user ||
                            (sessionData.user.type !== 'regular' &&
                              (sessionData.user as any)?.user_type !==
                                'pro') ? (
                            <div className="text-sm text-muted-foreground">
                              Sign in to view your chat history.
                            </div>
                          ) : filteredChats.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              No chat history found for your account.
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {paginatedChats.map((c) => (
                                  <div
                                    key={c.id}
                                    className="relative group rounded-lg p-3 bg-muted/50 border transition-all duration-200 hover:scale-[1.01] hover:bg-muted"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-card-foreground break-words select-text mb-1">
                                          {c.title || 'Untitled Chat'}
                                        </h4>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                              {new Date(
                                                c.createdAt,
                                              ).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                              {new Date(
                                                c.createdAt,
                                              ).toLocaleTimeString()}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            <span>1 token used</span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          className="opacity-0 group-hover:opacity-100 transition bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-full p-1 shadow border border-blue-500/30"
                                          onClick={() =>
                                            window.open(
                                              `/chat/${c.id}`,
                                              '_blank',
                                            )
                                          }
                                          title="Open chat in new tab"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <AlertDialog
                                        open={deleteChatDialogOpen === c.id}
                                        onOpenChange={(open) =>
                                          setDeleteChatDialogOpen(
                                            open ? c.id : undefined,
                                          )
                                        }
                                      >
                                        <AlertDialogTrigger asChild>
                                          <button
                                            type="button"
                                            className="opacity-0 group-hover:opacity-100 transition bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-full p-1 shadow border border-destructive/30"
                                            title="Delete chat"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete this chat?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. Are
                                              you sure you want to delete this
                                              chat and all its messages?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={async () => {
                                                await fetch(
                                                  `/api/chat/${c.id}`,
                                                  {
                                                    method: 'DELETE',
                                                  },
                                                );
                                                setChats((prev) =>
                                                  prev.filter(
                                                    (x) => x.id !== c.id,
                                                  ),
                                                );
                                                setDeleteChatDialogOpen(
                                                  undefined,
                                                );
                                              }}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-row justify-center items-center gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setHistoryPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={historyPage === 1}
                                >
                                  &lt;
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Page {historyPage} of {totalPages}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setHistoryPage((p) =>
                                      Math.min(totalPages, p + 1),
                                    )
                                  }
                                  disabled={historyPage === totalPages}
                                >
                                  &gt;
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="api-keys" className="mt-0">
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              API Keys
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Manage your API keys for external integrations
                            </p>
                          </div>

                          <div className="space-y-4">
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setApiKeyLoading(true);
                                setApiKeyError(null);
                                const res = await fetch(
                                  '/api/profile/api-key',
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      apiKey: apiKeyInput,
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  setApiKey(apiKeyInput);
                                  setApiKeyInput('');
                                } else {
                                  const data = await res.json();
                                  setApiKeyError(
                                    data.error || 'Failed to save API key',
                                  );
                                }
                                setApiKeyLoading(false);
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <span className="text-sm font-medium text-card-foreground">
                                  Bring your own key
                                </span>
                                <Input
                                  type="text"
                                  value={apiKeyInput}
                                  onChange={(e) =>
                                    setApiKeyInput(e.target.value)
                                  }
                                  className="mt-2"
                                  placeholder="Paste your API key here"
                                  disabled={apiKeyLoading}
                                />
                              </div>
                              <Button
                                type="submit"
                                disabled={apiKeyLoading || !apiKeyInput}
                              >
                                {apiKeyLoading ? 'Saving...' : 'Save Key'}
                              </Button>
                              {apiKeyError && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                  <p className="text-sm text-destructive">
                                    {apiKeyError}
                                  </p>
                                </div>
                              )}
                              {apiKey && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    Current key:{' '}
                                    <span className="font-mono">{apiKey}</span>
                                  </p>
                                </div>
                              )}
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="contact" className="mt-0">
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Contact Support
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Get help and support for your account
                            </p>
                          </div>

                          <form
                            action="https://formspree.io/f/yourFormId"
                            method="POST"
                            className="space-y-4"
                          >
                            <Input
                              name="name"
                              placeholder="Your Name"
                              required
                            />
                            <Input
                              name="email"
                              type="email"
                              placeholder="Your Email"
                              required
                            />
                            <textarea
                              name="message"
                              placeholder="Your Message"
                              required
                              className="w-full rounded-lg border bg-background px-3 py-2 min-h-[100px] resize-none"
                            />
                            <Button type="submit" className="w-full">
                              Send Message
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="billing" className="mt-0">
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-card p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              Billing & Subscription
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Manage your subscription and billing information
                            </p>
                          </div>

                          {plan === 'Pro Plan' ? (
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                                      Pro Plan Active
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                      Your subscription is active and you have
                                      access to all premium features.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                  <h4 className="font-semibold mb-2">
                                    Subscription Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Plan:
                                      </span>
                                      <span className="font-medium">
                                        Pro Plan
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Status:
                                      </span>
                                      <span className="font-medium text-green-600">
                                        Active
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Billing Cycle:
                                      </span>
                                      <span className="font-medium">
                                        Monthly
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Next Billing:
                                      </span>
                                      <span className="font-medium">
                                        30 days from now
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      // Redirect to Stripe customer portal
                                      window.open(
                                        'https://billing.stripe.com/session/your-portal-url',
                                        '_blank',
                                      );
                                    }}
                                  >
                                    Manage Subscription
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      // Cancel subscription logic
                                      console.log('Cancel subscription');
                                    }}
                                  >
                                    Cancel Plan
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {!isGuest && plan === 'Free Plan' ? (
                                <>
                                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800">
                                    <div className="text-center space-y-4">
                                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                                        <Sparkles className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-card-foreground mb-1">
                                          Upgrade to Pro
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                          Get 25x more messages, advanced AI
                                          models, and priority support
                                        </p>
                                      </div>
                                      <Button
                                        onClick={handleUpgradeToPro}
                                        disabled={upgrading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                      >
                                        {upgrading ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            Start Free Trial
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                          </>
                                        )}
                                      </Button>
                                      <p className="text-xs text-muted-foreground">
                                        30-day free trial • Cancel anytime
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                      <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">
                                        {plan === 'Free Plan'
                                          ? 'Free Plan'
                                          : 'Guest Account'}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {plan === 'Free Plan'
                                          ? 'Upgrade to Pro for unlimited messages and premium features.'
                                          : 'Sign up for a free account to access more features.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
