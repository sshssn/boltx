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
  ArrowLeft,
  LogOut,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

const tabItems = [
  { id: 'account', label: 'Account', icon: <User size={16} /> },
  { id: 'history', label: 'History & Sync', icon: <History size={16} /> },
  { id: 'memories', label: 'Memories', icon: <Bot size={16} /> },
  { id: 'api-keys', label: 'API Keys', icon: <Key size={16} /> },
  { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
  { id: 'contact', label: 'Contact', icon: <MessageCircle size={16} /> },
];

export default function ClientAccountDashboard({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [plan, setPlan] = useState('Free Plan');
  const [messagesUsed, setMessagesUsed] = useState<number>(0);
  const [messagesLimit, setMessagesLimit] = useState<number>(20);
  const [isGuest, setIsGuest] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const chatsPerPage = 3;
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

  const { data: sessionData, update: updateSession } = useSession();
  const [username, setUsername] = useState(
    (sessionData?.user as any)?.username || '',
  );
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabItems.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsGuest(sessionData?.user?.type === 'guest');
  }, [sessionData]);

  useEffect(() => {
    async function fetchUsage() {
      const res = await fetch('/api/profile/tokens');
      if (res.ok) {
        const data = await res.json();
        setMessagesUsed(data.tokensUsed ?? 0);
        setMessagesLimit(data.messagesLimit ?? 20);
        // Set plan name based on limit
        if (data.messagesLimit === 10) setPlan('Guest Plan');
        else if (data.messagesLimit === 20) setPlan('Free Plan');
        else if (data.messagesLimit === 500) setPlan('Pro Plan');
        else setPlan('Custom Plan');
      } else {
        setMessagesUsed(0);
        setMessagesLimit(20);
        setPlan('Free Plan');
      }
    }
    fetchUsage();
  }, [sessionData]);

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await fetch('/api/profile/delete', { method: 'POST' });
    setDeleting(false);
    if (res.ok) {
      router.push('/');
    }
  };

  const displayName = sessionData?.user?.email || 'Account';
  const messagesRemaining = Math.max(messagesLimit - messagesUsed, 0);
  const usagePercent = Math.min((messagesUsed / messagesLimit) * 100, 100);

  return (
    <div
      className="relative min-h-svh w-full flex flex-col items-center justify-center bg-background text-foreground font-poppins overflow-hidden pt-4 dashboard-bg"
      style={{ fontFamily: 'Poppins, Lato, Arial, sans-serif' }}
    >
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground text-sm font-medium shadow border border-white/20 backdrop-blur-md transition-all"
          onClick={() => router.push('/')}
        >
          ← Back to Chat
        </Button>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-0 md:px-8 flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
          <Card className="bg-zinc-900/80 border border-white/10 shadow-xl flex flex-col items-center gap-2 p-8">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarFallback>
                <User size={32} />
              </AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold text-white">{displayName}</span>
            <span className="text-sm text-zinc-300">
              {sessionData?.user?.email}
            </span>
            <Badge variant="secondary" className="mt-2">
              {plan}
            </Badge>
          </Card>
          <Card className="bg-zinc-900/80 border border-white/10 shadow p-6 flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-zinc-200">
                  Message Usage
                </span>
                <span className="text-xs text-zinc-400">
                  Resets today at 12:00am
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Standard</span>
                <span>
                  {messagesUsed}/{messagesLimit}
                </span>
              </div>
              <Progress value={usagePercent} className="w-full h-2 mb-1" />
              <div className="text-xs text-zinc-400">
                {messagesRemaining} messages remaining
              </div>
              {isGuest && (
                <div className="text-xs text-pink-400 mt-2">
                  You are using a guest account. You have 10 messages per day.{' '}
                  <a href="/auth" className="underline">
                    Sign up
                  </a>{' '}
                  to increase your limit!
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-2">
              Each tool call (e.g. search grounding) used in a reply consumes an
              additional standard credit. Models may not always utilize enabled
              tools.
            </div>
          </Card>
          <Card className="bg-zinc-900/80 border border-white/10 shadow p-6 flex flex-col gap-2">
            <div className="font-medium text-sm mb-2">Keyboard Shortcuts</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span>Search</span>
                <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                  ⌘ K
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>New Chat</span>
                <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                  ⇧ O
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Toggle Sidebar</span>
                <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                  ⌘ B
                </span>
              </div>
            </div>
          </Card>
        </aside>
        {/* Main Content */}
        <main className="flex-1 w-full bg-[#23243a]/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="w-full overflow-x-auto">
              <TabsList className="mb-3 h-auto w-full justify-start rounded-lg bg-zinc-900/80 p-1 text-secondary-foreground border border-white/10 shadow">
                <div className="flex w-full gap-1 overflow-auto no-scrollbar">
                  {tabItems.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-zinc-950/80 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-zinc-900/60"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </div>
            <div className="mt-6 space-y-12">
              <TabsContent value="account" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-zinc-900/80 border border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback>
                            <User size={24} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-medium">{displayName}</h3>
                          <p className="text-sm text-zinc-300">
                            {sessionData?.user?.email}
                          </p>
                          <Badge variant="secondary">{plan}</Badge>
                          <div className="text-xs mt-1">
                            Messages used today: (not available)
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium mb-1"
                        >
                          Username
                        </label>
                        {editingUsername ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              id="username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              disabled={usernameLoading}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                setUsernameLoading(true);
                                setUsernameError('');
                                setUsernameSuccess('');
                                if (!username.trim()) {
                                  setUsernameError('Username is required.');
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
                                // Check uniqueness and update
                                const res = await fetch(
                                  '/api/profile/username',
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ username }),
                                  },
                                );
                                if (res.ok) {
                                  setUsernameSuccess('Username updated!');
                                  setEditingUsername(false);
                                  updateSession(); // Refresh session
                                } else {
                                  const data = await res.json();
                                  setUsernameError(
                                    data.error || 'Failed to update username',
                                  );
                                }
                                setUsernameLoading(false);
                              }}
                              disabled={usernameLoading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingUsername(false);
                                setUsername(
                                  (sessionData?.user as any)?.username || '',
                                );
                                setUsernameError('');
                              }}
                              disabled={usernameLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-base font-mono">
                              {username || 'Not set'}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingUsername(true)}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                        <div className="text-xs text-zinc-400 min-h-[1.5em]">
                          Choose a unique username. This helps the AI address
                          you personally and improves your chat experience.
                        </div>
                        {usernameError && (
                          <div className="text-red-500 text-sm">
                            {usernameError}
                          </div>
                        )}
                        {usernameSuccess && (
                          <div className="text-green-500 text-sm">
                            {usernameSuccess}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/80 border border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="delete-account-btn"
                            className="block text-sm font-medium mb-1"
                          >
                            Delete Account
                          </label>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                id="delete-account-btn"
                                size="sm"
                                variant="destructive"
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete Account'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this account?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Are you sure you
                                  want to delete your account?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="memories" className="mt-0">
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                    <CardHeader>
                      <CardTitle>Memories</CardTitle>
                      <CardDescription>Your unique AI memories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {memoriesLoading ? (
                        <div className="text-sm text-zinc-400">Loading...</div>
                      ) : memories.length === 0 ? (
                        <div className="text-sm text-zinc-400">
                          No memories found for your account.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {memories.map((m) => (
                            <div
                              key={m.id}
                              className="relative group rounded-2xl px-6 py-5 bg-white/30 dark:bg-zinc-900/60 border border-white/30 shadow backdrop-blur-xl flex flex-col min-h-[100px] transition hover:scale-[1.01]"
                            >
                              <span
                                className="font-mono text-base text-foreground break-words select-text"
                                style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                }}
                              >
                                {m.content}
                              </span>
                              <span className="text-xs text-zinc-400 mt-2">
                                {new Date(m.createdAt).toLocaleString()}
                              </span>
                              <AlertDialog
                                open={deleteDialogOpen === m.id}
                                onOpenChange={(open) =>
                                  setDeleteDialogOpen(open ? m.id : null)
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <button
                                    type="button"
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-white/30 hover:bg-white/50 text-zinc-900 rounded-full p-1 shadow border border-white/30"
                                    title="Delete memory"
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
                                        stroke="#18181b"
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
                                      This action cannot be undone. Are you sure
                                      you want to delete this memory?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        await fetch(`/api/memory?id=${m.id}`, {
                                          method: 'DELETE',
                                        });
                                        setMemories((prev) =>
                                          prev.filter((x) => x.id !== m.id),
                                        );
                                        setDeleteDialogOpen(null);
                                      }}
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
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <div className="space-y-6">
                  <Card className="backdrop-blur-xl bg-white/10 dark:bg-zinc-900/60 border border-white/20 shadow-2xl">
                    <CardHeader>
                      <CardTitle>Chat History</CardTitle>
                      <CardDescription>
                        Manage your conversation history and sync settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                          (sessionData.user as any)?.user_type !== 'pro') ? (
                        <div className="text-sm text-muted-foreground">
                          Sign in to view your chat history.
                        </div>
                      ) : filteredChats.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No chat history found for your account.
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-4">
                            {paginatedChats.map((c) => (
                              <div
                                key={c.id}
                                className="relative group rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-900/60 border border-white/30 shadow backdrop-blur-xl flex flex-col min-h-[60px] transition hover:scale-[1.01] text-sm"
                              >
                                <span className="text-base text-foreground break-words select-text">
                                  {c.title || 'Untitled Chat'}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="w-fit mt-2 bg-white/30 hover:bg-white/50 text-zinc-900 dark:text-white font-semibold rounded-full px-3 py-1 shadow border border-white/30 text-xs"
                                  onClick={() =>
                                    window.open(`/chat/${c.id}`, '_blank')
                                  }
                                >
                                  Open Chat
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-row justify-center items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setHistoryPage((p) => Math.max(1, p - 1))
                              }
                              disabled={historyPage === 1}
                            >
                              &lt;
                            </Button>
                            <span className="text-xs">
                              Page {historyPage} of {totalPages}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
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
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="api-keys" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-zinc-900/80 border border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle>API Keys</CardTitle>
                      <CardDescription>
                        Manage your API keys for external integrations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setApiKeyLoading(true);
                            setApiKeyError(null);
                            const res = await fetch('/api/profile/api-key', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ apiKey: apiKeyInput }),
                            });
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
                          className="flex flex-col gap-2"
                        >
                          <label
                            htmlFor="api-key-input"
                            className="text-sm font-medium"
                          >
                            Bring your own key
                          </label>
                          <input
                            id="api-key-input"
                            type="text"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            className="px-3 py-2 rounded border bg-background text-foreground"
                            placeholder="Paste your API key here"
                            disabled={apiKeyLoading}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={apiKeyLoading || !apiKeyInput}
                          >
                            {apiKeyLoading ? 'Saving...' : 'Save Key'}
                          </Button>
                          {apiKeyError && (
                            <div className="text-xs text-red-500">
                              {apiKeyError}
                            </div>
                          )}
                          {apiKey && (
                            <div className="text-xs text-green-500 mt-2">
                              Current key:{' '}
                              <span className="font-mono">{apiKey}</span>
                            </div>
                          )}
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-zinc-900/80 border border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle>File Attachments</CardTitle>
                      <CardDescription>
                        Your uploaded files and attachments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attachmentsLoading ? (
                        <div className="text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : attachments.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No attachments found for your account.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {attachments.map((a) => (
                            <div
                              key={a.id}
                              className="relative group rounded-2xl px-6 py-5 bg-white/30 dark:bg-zinc-900/60 border border-white/30 shadow backdrop-blur-xl flex flex-col min-h-[80px] transition hover:scale-[1.01]"
                            >
                              <span className="font-mono text-base text-foreground break-words select-text">
                                {a.title || a.name || 'Untitled Attachment'}
                              </span>
                              <span className="text-xs text-muted-foreground mt-2">
                                {new Date(a.createdAt).toLocaleString()}
                              </span>
                              {a.kind === 'image' && a.content && (
                                <img
                                  src={a.content}
                                  alt={a.title}
                                  className="mt-2 max-h-32 rounded"
                                />
                              )}
                              {/* Add download/view link if available */}
                              {a.content && (
                                <a
                                  href={a.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 underline mt-2 w-fit"
                                >
                                  View/Download
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="contact" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-zinc-900/80 border border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle>Contact Support</CardTitle>
                      <CardDescription>
                        Get help and support for your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-28 rounded-lg bg-zinc-800/60" />
                        <div className="h-20 rounded-lg bg-zinc-800/60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
