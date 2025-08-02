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
  Users,
  Shield,
  Settings,
  BarChart3,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Minus,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Building,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Wrench,
  Server,
  HardDrive,
  Network,
  Cpu,
  Memory,
  HardDriveIcon,
  Database as DatabaseIcon,
  Cloud,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Fullscreen,
  FullscreenExit,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Printer,
  Camera,
  Video,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Volume1,
  Volume3,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Zap as ZapIcon,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  Flag,
  MapPin,
  Navigation,
  Compass,
  Globe as GlobeIcon,
  Map,
  Layers,
  Grid,
  List,
  Columns,
  Rows,
  Layout,
  Sidebar,
  SidebarClose,
  SidebarOpen,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Split,
  SplitSquareVertical,
  SplitSquareHorizontal,
  SplitVertical,
  SplitHorizontal,
  Combine,
  Unlink,
  Link,
  Link2,
  Unlink2,
  Share,
  Share2,
  Send,
  SendHorizontal,
  Mail as MailIcon,
  Inbox,
  Archive,
  ArchiveX,
  Reply,
  ReplyAll,
  Forward,
  ForwardAll,
  Save,
  SaveAll,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderHeart,
  FolderKey,
  FolderLock,
  FolderUnlock,
  FolderCog,
  FolderSettings,
  FolderGit,
  FolderGit2,
  FolderKanban,
  FolderTree,
  FolderInput,
  FolderOutput,
  FolderSymlink,
  FolderArchive,
  FolderArchive2,
  FolderArchive3,
  FolderArchive4,
  FolderArchive5,
  FolderArchive6,
  FolderArchive7,
  FolderArchive8,
  FolderArchive9,
  FolderArchive10,
  FolderArchive11,
  FolderArchive12,
  FolderArchive13,
  FolderArchive14,
  FolderArchive15,
  FolderArchive16,
  FolderArchive17,
  FolderArchive18,
  FolderArchive19,
  FolderArchive20,
  FolderArchive21,
  FolderArchive22,
  FolderArchive23,
  FolderArchive24,
  FolderArchive25,
  FolderArchive26,
  FolderArchive27,
  FolderArchive28,
  FolderArchive29,
  FolderArchive30,
  FolderArchive31,
  FolderArchive32,
  FolderArchive33,
  FolderArchive34,
  FolderArchive35,
  FolderArchive36,
  FolderArchive37,
  FolderArchive38,
  FolderArchive39,
  FolderArchive40,
  FolderArchive41,
  FolderArchive42,
  FolderArchive43,
  FolderArchive44,
  FolderArchive45,
  FolderArchive46,
  FolderArchive47,
  FolderArchive48,
  FolderArchive49,
  FolderArchive50,
  FolderArchive51,
  FolderArchive52,
  FolderArchive53,
  FolderArchive54,
  FolderArchive55,
  FolderArchive56,
  FolderArchive57,
  FolderArchive58,
  FolderArchive59,
  FolderArchive60,
  FolderArchive61,
  FolderArchive62,
  FolderArchive63,
  FolderArchive64,
  FolderArchive65,
  FolderArchive66,
  FolderArchive67,
  FolderArchive68,
  FolderArchive69,
  FolderArchive70,
  FolderArchive71,
  FolderArchive72,
  FolderArchive73,
  FolderArchive74,
  FolderArchive75,
  FolderArchive76,
  FolderArchive77,
  FolderArchive78,
  FolderArchive79,
  FolderArchive80,
  FolderArchive81,
  FolderArchive82,
  FolderArchive83,
  FolderArchive84,
  FolderArchive85,
  FolderArchive86,
  FolderArchive87,
  FolderArchive88,
  FolderArchive89,
  FolderArchive90,
  FolderArchive91,
  FolderArchive92,
  FolderArchive93,
  FolderArchive94,
  FolderArchive95,
  FolderArchive96,
  FolderArchive97,
  FolderArchive98,
  FolderArchive99,
  FolderArchive100,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tabItems = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
  { id: 'users', label: 'Users', icon: <Users size={16} /> },
  { id: 'tickets', label: 'Support Tickets', icon: <Ticket size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    systemHealth: 'healthy',
    uptime: 99.9,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Management
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilter, setUsersFilter] = useState('');
  const [usersPagination, setUsersPagination] = useState<any>(null);

  // Tickets Management
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsFilter, setTicketsFilter] = useState('');
  const [ticketsPagination, setTicketsPagination] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    revenueData: [],
    ticketTrends: [],
    systemMetrics: {},
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [systemStatus, setSystemStatus] = useState<any>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    cache: 'healthy',
  });

  // Settings
  const [adminSettings, setAdminSettings] = useState({
    emailNotifications: true,
    autoBackup: true,
    debugMode: false,
    rateLimit: 1000,
  });

  // UI States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | undefined>(
    undefined,
  );
  const [userActionLoading, setUserActionLoading] = useState<
    string | undefined
  >(undefined);
  const [ticketActionLoading, setTicketActionLoading] = useState<
    string | undefined
  >(undefined);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Auto-refresh indicators
  const [lastRefresh, setLastRefresh] = useState<{ [key: string]: Date }>({});
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const { data: sessionData, status, update: updateSession } = useSession();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabItems.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading' || !sessionData?.user) return;

    // Check if user is admin
    if (
      sessionData.user.type !== 'admin' &&
      (sessionData.user as any)?.role !== 'admin'
    ) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }
  }, [sessionData, status, router]);

  // Auto-refresh intervals (in milliseconds)
  const OVERVIEW_REFRESH_INTERVAL = 30000; // 30 seconds
  const USERS_REFRESH_INTERVAL = 60000; // 1 minute
  const TICKETS_REFRESH_INTERVAL = 30000; // 30 seconds
  const ANALYTICS_REFRESH_INTERVAL = 120000; // 2 minutes
  const MAINTENANCE_REFRESH_INTERVAL = 60000; // 1 minute

  // Auto-refresh for overview stats
  useEffect(() => {
    if (activeTab === 'overview' && sessionData?.user) {
      fetchOverviewStats();

      const interval = setInterval(() => {
        fetchOverviewStats();
      }, OVERVIEW_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, sessionData]);

  // Auto-refresh for users
  useEffect(() => {
    if (activeTab === 'users' && sessionData?.user) {
      fetchUsers();

      const interval = setInterval(() => {
        fetchUsers();
      }, USERS_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, sessionData, usersPage, usersSearch, usersFilter]);

  // Auto-refresh for tickets
  useEffect(() => {
    if (activeTab === 'tickets' && sessionData?.user) {
      fetchTickets();

      const interval = setInterval(() => {
        fetchTickets();
      }, TICKETS_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, sessionData, ticketsPage, ticketsSearch, ticketsFilter]);

  // Auto-refresh for analytics
  useEffect(() => {
    if (activeTab === 'analytics' && sessionData?.user) {
      fetchAnalytics();

      const interval = setInterval(() => {
        fetchAnalytics();
      }, ANALYTICS_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, sessionData]);

  // Auto-refresh for maintenance
  useEffect(() => {
    if (activeTab === 'maintenance' && sessionData?.user) {
      fetchMaintenanceStatus();

      const interval = setInterval(() => {
        fetchMaintenanceStatus();
      }, MAINTENANCE_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, sessionData]);

  useEffect(() => {
    if (activeTab === 'settings' && sessionData?.user) {
      fetchAdminSettings();
    }
  }, [activeTab, sessionData]);

  const fetchOverviewStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        // Ensure all required fields have fallback values
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalTickets: data.totalTickets || 0,
          openTickets: data.openTickets || 0,
          totalRevenue: data.totalRevenue || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          systemHealth: data.systemHealth || 'healthy',
          uptime: data.uptime || 99.9,
        });
        setLastRefresh((prev) => ({ ...prev, overview: new Date() }));
      } else {
        toast.error('Failed to fetch overview stats');
        // Set default values on error
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalTickets: 0,
          openTickets: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          systemHealth: 'healthy',
          uptime: 99.9,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Network error. Please try again.');
      // Set default values on network error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        systemHealth: 'healthy',
        uptime: 99.9,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: '20',
        ...(usersSearch && { search: usersSearch }),
        ...(usersFilter && usersFilter !== 'all' && { status: usersFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUsersPagination(data.pagination);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const params = new URLSearchParams({
        page: ticketsPage.toString(),
        limit: '20',
        ...(ticketsSearch && { search: ticketsSearch }),
        ...(ticketsFilter &&
          ticketsFilter !== 'all' && { status: ticketsFilter }),
      });

      const res = await fetch(`/api/admin/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTicketsPagination(data.pagination);
      } else {
        toast.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/admin/maintenance');
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage);
        setSystemStatus(data.systemStatus);
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    }
  };

  const fetchAdminSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data);
      } else {
        toast.error('Failed to fetch admin settings');
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // User Management Actions
  const handleUserAction = async (userId: string, action: string) => {
    setUserActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(`User ${action} successfully`);
        fetchUsers(); // Refresh users list
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error('Network error. Please try again.');
    } finally {
      setUserActionLoading(undefined);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUserActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('User deleted successfully');
        fetchUsers(); // Refresh users list
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUserActionLoading(undefined);
      setDeleteDialogOpen(undefined);
    }
  };

  // Ticket Management Actions
  const handleTicketAction = async (
    ticketId: string,
    action: string,
    data?: any,
  ) => {
    setTicketActionLoading(ticketId);
    try {
      let endpoint = `/api/admin/tickets/${ticketId}`;
      let method = 'PATCH';
      let body = { action, ...data };

      // For replies, use the reply endpoint
      if (action === 'reply') {
        endpoint = `/api/admin/tickets/${ticketId}/reply`;
        method = 'POST';
        body = { content: data.reply, isAdminReply: true };
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`Ticket ${action} successfully`);
        fetchTickets(); // Refresh tickets list
        if (action === 'reply') {
          setReplyText('');
          setSelectedTicket(null);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to ${action} ticket`);
      }
    } catch (error) {
      console.error(`Error ${action}ing ticket:`, error);
      toast.error('Network error. Please try again.');
    } finally {
      setTicketActionLoading(undefined);
    }
  };

  const handleReplyToTicket = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      await handleTicketAction(selectedTicket.id, 'reply', {
        reply: replyText,
      });
      setReplyText('');
      setSelectedTicket(null);
      toast.success('Reply sent successfully!');
    } catch (error) {
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setReplying(false);
    }
  };

  // Maintenance Actions
  const handleMaintenanceToggle = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceMode: !maintenanceMode,
          message: maintenanceMessage,
        }),
      });

      if (res.ok) {
        setMaintenanceMode(!maintenanceMode);
        toast.success(
          maintenanceMode
            ? 'Maintenance mode disabled'
            : 'Maintenance mode enabled',
        );
      } else {
        toast.error('Failed to toggle maintenance mode');
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Settings Actions
  const handleSettingsUpdate = async (updates: any) => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setAdminSettings(data);
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Helper Functions
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-500';
    switch (status) {
      case 'active':
      case 'healthy':
      case 'open':
        return 'bg-green-500';
      case 'inactive':
      case 'suspended':
      case 'closed':
        return 'bg-red-500';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    if (!status || status === 'undefined' || status === 'null')
      return 'Healthy';
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  };

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
            Please sign in to access the admin dashboard.
          </p>
          <Button onClick={() => router.push('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Check admin access
  if (
    sessionData?.user &&
    sessionData.user.type !== 'admin' &&
    (sessionData.user as any)?.role !== 'admin'
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            Admin privileges required to access this dashboard.
          </p>
          <Button onClick={() => router.push('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background text-foreground font-sans overflow-hidden relative">
      {/* Enhanced background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.04),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation Layout */}
        <div className="sticky top-0 z-50 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
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
            {/* Left Panel - Admin Info & Quick Stats */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              {/* Admin Profile Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <UserAvatar
                      email={sessionData?.user?.email}
                      name={sessionData?.user?.name || 'Admin'}
                      size={80}
                      className="size-20"
                    />
                    <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Shield className="size-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {sessionData?.user?.name || 'Admin'}
                    </h2>
                    {sessionData?.user?.email && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {sessionData.user.email}
                      </p>
                    )}
                    <Badge className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 backdrop-blur-sm">
                      Administrator
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-foreground">
                      System Overview
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                          Live
                        </span>
                      </div>
                      {lastRefresh.overview && (
                        <span className="text-xs text-muted-foreground">
                          {lastRefresh.overview.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="text-foreground font-medium">
                        {statsLoading
                          ? '...'
                          : (stats.totalUsers || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Active Users
                      </span>
                      <span className="text-foreground font-medium">
                        {statsLoading
                          ? '...'
                          : (stats.activeUsers || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Open Tickets
                      </span>
                      <span className="text-foreground font-medium">
                        {statsLoading ? '...' : stats.openTickets || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        System Health
                      </span>
                      <span
                        className={`font-medium ${
                          (stats.systemHealth || 'healthy') === 'healthy'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {statsLoading
                          ? '...'
                          : getStatusText(stats.systemHealth || 'healthy')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="text-foreground font-medium">
                        {statsLoading ? '...' : `${stats.uptime || 99.9}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="rounded-xl border border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl p-6 shadow-lg">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('tickets')}
                    className="w-full justify-start text-left bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 backdrop-blur-sm"
                  >
                    <Ticket className="size-4 mr-2" />
                    View Tickets
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('users')}
                    className="w-full justify-start text-left bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 backdrop-blur-sm"
                  >
                    <Users className="size-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('maintenance')}
                    className="w-full justify-start text-left bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 backdrop-blur-sm"
                  >
                    <Wrench className="size-4 mr-2" />
                    System Status
                  </Button>
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
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Dashboard Overview
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Monitor system performance, user activity, and
                            revenue metrics.
                          </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Users
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-foreground">
                                {statsLoading
                                  ? '...'
                                  : (stats.totalUsers || 0).toLocaleString()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stats.activeUsers || 0} active today
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Revenue
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-foreground">
                                {statsLoading
                                  ? '...'
                                  : formatCurrency(stats.totalRevenue || 0)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(stats.monthlyRevenue || 0)} this
                                month
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Support Tickets
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-foreground">
                                {statsLoading ? '...' : stats.totalTickets || 0}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stats.openTickets || 0} open tickets
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                System Health
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-foreground">
                                {statsLoading
                                  ? '...'
                                  : `${stats.uptime || 99.9}%`}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Uptime •{' '}
                                {getStatusText(stats.systemHealth || 'healthy')}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Recent Activity */}
                        <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                              Recent Activity
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Latest system events and user actions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {statsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    Loading activity...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setActiveTab('users')}
                                  >
                                    <div className="size-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                      <Users className="size-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-foreground">
                                        {stats.activeUsers || 0} active users
                                        today
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Click to view user management
                                      </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                  </div>

                                  <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setActiveTab('tickets')}
                                  >
                                    <div className="size-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                      <Ticket className="size-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-foreground">
                                        {stats.openTickets || 0} open support
                                        tickets
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Click to view tickets
                                      </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                  </div>

                                  <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setActiveTab('analytics')}
                                  >
                                    <div className="size-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                                      <Receipt className="size-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-foreground">
                                        $
                                        {(
                                          stats.monthlyRevenue || 0
                                        ).toLocaleString()}{' '}
                                        revenue this month
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Click to view analytics
                                      </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                  </div>

                                  <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setActiveTab('maintenance')}
                                  >
                                    <div className="size-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                                      <Activity className="size-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-foreground">
                                        System uptime: {stats.uptime || 99.9}%
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Click to view system status
                                      </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                  </div>

                                  <div
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => setActiveTab('analytics')}
                                  >
                                    <div className="size-8 bg-indigo-500/10 rounded-full flex items-center justify-center">
                                      <TrendingUp className="size-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-foreground">
                                        {(
                                          stats.totalUsers || 0
                                        ).toLocaleString()}{' '}
                                        total registered users
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Click to view growth analytics
                                      </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users" className="mt-0">
                      <div className="space-y-6 h-[calc(100vh-300px)] flex flex-col">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            User Management
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Manage user accounts, permissions, and status.
                          </p>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search users..."
                              value={usersSearch}
                              onChange={(e) => setUsersSearch(e.target.value)}
                              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          </div>
                          <Select
                            value={usersFilter}
                            onValueChange={setUsersFilter}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">
                                Suspended
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {usersLoading ? (
                          <div className="flex items-center justify-center py-12 flex-1">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading users...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>User</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Plan</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Joined</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {users.map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <UserAvatar
                                          email={user.email}
                                          name={user.name || user.username}
                                          size={32}
                                        />
                                        <div>
                                          <p className="text-sm font-medium text-foreground">
                                            {user.name || user.username}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {user.username}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {user.email}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          user.plan === 'pro'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                      >
                                        {user.plan || 'free'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`size-2 rounded-full ${getStatusColor(user.status)}`}
                                        />
                                        <span className="text-sm">
                                          {getStatusText(user.status)}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="size-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleUserAction(
                                                user.id,
                                                'suspend',
                                              )
                                            }
                                          >
                                            <UserX className="size-4 mr-2" />
                                            Suspend
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleUserAction(
                                                user.id,
                                                'activate',
                                              )
                                            }
                                          >
                                            <UserCheck className="size-4 mr-2" />
                                            Activate
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              setDeleteDialogOpen(user.id)
                                            }
                                            className="text-red-600"
                                          >
                                            <Trash2 className="size-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Tickets Tab */}
                    <TabsContent value="tickets" className="mt-0">
                      <div className="space-y-6 h-[calc(100vh-300px)] flex flex-col">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Support Tickets
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Manage and respond to user support requests.
                          </p>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search tickets..."
                              value={ticketsSearch}
                              onChange={(e) => setTicketsSearch(e.target.value)}
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
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {ticketsLoading ? (
                          <div className="flex items-center justify-center py-12 flex-1">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading tickets...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            {tickets.map((ticket) => (
                              <Card
                                key={ticket.id}
                                className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl"
                              >
                                <CardContent className="p-4">
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
                                        {getStatusText(ticket.status)}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(ticket.createdAt)}
                                    </span>
                                  </div>
                                  <h5 className="font-medium text-foreground mb-2">
                                    {ticket.subject}
                                  </h5>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {ticket.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <User className="size-4" />
                                      {ticket.user?.name || ticket.user?.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setSelectedTicket(ticket)
                                        }
                                      >
                                        <Eye className="size-4" />
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleTicketAction(
                                            ticket.id,
                                            'resolve',
                                          )
                                        }
                                        disabled={
                                          ticketActionLoading === ticket.id
                                        }
                                      >
                                        {ticketActionLoading === ticket.id ? (
                                          <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="size-4" />
                                        )}
                                        Resolve
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="mt-0">
                      <div className="space-y-6 h-[calc(100vh-300px)] flex flex-col">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Analytics Dashboard
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Comprehensive analytics and insights for your
                            platform.
                          </p>
                        </div>

                        {analyticsLoading ? (
                          <div className="flex items-center justify-center py-12 flex-1">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                              Loading analytics...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                            {/* User Growth Chart */}
                            <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                              <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                  User Growth
                                </CardTitle>
                                <CardDescription>
                                  Monthly user registration trends
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[300px] w-full">
                                  <AreaChart
                                    data={[
                                      { month: 'Jan', users: 1200, growth: 15 },
                                      { month: 'Feb', users: 1400, growth: 17 },
                                      { month: 'Mar', users: 1600, growth: 14 },
                                      { month: 'Apr', users: 1800, growth: 13 },
                                      { month: 'May', users: 2100, growth: 17 },
                                      { month: 'Jun', users: 2400, growth: 14 },
                                      { month: 'Jul', users: 2800, growth: 17 },
                                      { month: 'Aug', users: 3200, growth: 14 },
                                      { month: 'Sep', users: 3600, growth: 13 },
                                      { month: 'Oct', users: 4100, growth: 14 },
                                      { month: 'Nov', users: 4600, growth: 12 },
                                      { month: 'Dec', users: 5200, growth: 13 },
                                    ]}
                                    margin={{
                                      top: 10,
                                      right: 30,
                                      left: 0,
                                      bottom: 0,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="colorUsers"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="5%"
                                          stopColor="#8884d8"
                                          stopOpacity={0.8}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#8884d8"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      className="opacity-30"
                                    />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Area
                                      type="monotone"
                                      dataKey="users"
                                      stroke="#8884d8"
                                      fillOpacity={1}
                                      fill="url(#colorUsers)"
                                    />
                                  </AreaChart>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Revenue Analytics */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                                <CardHeader>
                                  <CardTitle className="text-lg font-semibold text-foreground">
                                    Revenue Trends
                                  </CardTitle>
                                  <CardDescription>
                                    Monthly revenue performance
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-[250px] w-full">
                                    <BarChart
                                      data={[
                                        { month: 'Jan', revenue: 45000 },
                                        { month: 'Feb', revenue: 52000 },
                                        { month: 'Mar', revenue: 48000 },
                                        { month: 'Apr', revenue: 61000 },
                                        { month: 'May', revenue: 55000 },
                                        { month: 'Jun', revenue: 67000 },
                                      ]}
                                      margin={{
                                        top: 10,
                                        right: 30,
                                        left: 0,
                                        bottom: 0,
                                      }}
                                    >
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                      />
                                      <XAxis dataKey="month" />
                                      <YAxis />
                                      <Bar dataKey="revenue" fill="#82ca9d" />
                                    </BarChart>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                                <CardHeader>
                                  <CardTitle className="text-lg font-semibold text-foreground">
                                    Ticket Resolution
                                  </CardTitle>
                                  <CardDescription>
                                    Support ticket resolution time
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-[250px] w-full">
                                    <LineChart
                                      data={[
                                        { month: 'Jan', avgTime: 2.5 },
                                        { month: 'Feb', avgTime: 2.1 },
                                        { month: 'Mar', avgTime: 1.8 },
                                        { month: 'Apr', avgTime: 1.6 },
                                        { month: 'May', avgTime: 1.4 },
                                        { month: 'Jun', avgTime: 1.2 },
                                      ]}
                                      margin={{
                                        top: 10,
                                        right: 30,
                                        left: 0,
                                        bottom: 0,
                                      }}
                                    >
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                      />
                                      <XAxis dataKey="month" />
                                      <YAxis />
                                      <Line
                                        type="monotone"
                                        dataKey="avgTime"
                                        stroke="#ff7300"
                                        strokeWidth={2}
                                      />
                                    </LineChart>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* User Demographics */}
                            <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                              <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                  User Demographics
                                </CardTitle>
                                <CardDescription>
                                  User distribution by plan type
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[300px] w-full">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        {
                                          name: 'Free',
                                          value: 65,
                                          color: '#8884d8',
                                        },
                                        {
                                          name: 'Pro',
                                          value: 25,
                                          color: '#82ca9d',
                                        },
                                        {
                                          name: 'Enterprise',
                                          value: 10,
                                          color: '#ffc658',
                                        },
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                      }
                                    >
                                      {[
                                        {
                                          name: 'Free',
                                          value: 65,
                                          color: '#8884d8',
                                        },
                                        {
                                          name: 'Pro',
                                          value: 25,
                                          color: '#82ca9d',
                                        },
                                        {
                                          name: 'Enterprise',
                                          value: 10,
                                          color: '#ffc658',
                                        },
                                      ].map((entry, index) => (
                                        <Cell
                                          key={`cell-${entry.name}`}
                                          fill={entry.color}
                                        />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Maintenance Tab */}
                    <TabsContent value="maintenance" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            System Maintenance
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Monitor system health and manage maintenance mode.
                          </p>
                        </div>

                        {/* System Status */}
                        <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                              System Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(systemStatus).map(
                                ([service, status]) => (
                                  <div
                                    key={service}
                                    className="text-center p-4 rounded-lg bg-muted/30 border border-border/50"
                                  >
                                    <div
                                      className={`size-3 rounded-full ${getStatusColor(status)} mx-auto mb-2`}
                                    />
                                    <p className="text-sm font-medium text-foreground capitalize">
                                      {service}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {getStatusText(status)}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Maintenance Mode */}
                        <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                              Maintenance Mode
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Enable maintenance mode to temporarily disable the
                              application for updates.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Maintenance Mode
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {maintenanceMode
                                    ? 'Currently enabled'
                                    : 'Currently disabled'}
                                </p>
                              </div>
                              <Button
                                onClick={handleMaintenanceToggle}
                                disabled={maintenanceLoading}
                                variant={
                                  maintenanceMode ? 'destructive' : 'default'
                                }
                              >
                                {maintenanceLoading ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Wrench className="size-4" />
                                )}
                                {maintenanceMode ? 'Disable' : 'Enable'}
                              </Button>
                            </div>
                            {maintenanceMode && (
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Maintenance Message
                                </label>
                                <Textarea
                                  value={maintenanceMessage}
                                  onChange={(e) =>
                                    setMaintenanceMessage(e.target.value)
                                  }
                                  placeholder="Enter maintenance message for users..."
                                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Admin Settings
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Configure system settings and preferences.
                          </p>
                        </div>

                        <Card className="border-border/50 bg-white/90 dark:bg-card/50 backdrop-blur-xl">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                              System Configuration
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Email Notifications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Receive email alerts for important events
                                </p>
                              </div>
                              <Button
                                variant={
                                  adminSettings.emailNotifications
                                    ? 'default'
                                    : 'secondary'
                                }
                                size="sm"
                                onClick={() =>
                                  handleSettingsUpdate({
                                    emailNotifications:
                                      !adminSettings.emailNotifications,
                                  })
                                }
                                disabled={settingsLoading}
                              >
                                {settingsLoading ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                {adminSettings.emailNotifications
                                  ? 'Enabled'
                                  : 'Disabled'}
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Auto Backup
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Automatically backup system data
                                </p>
                              </div>
                              <Button
                                variant={
                                  adminSettings.autoBackup
                                    ? 'default'
                                    : 'secondary'
                                }
                                size="sm"
                                onClick={() =>
                                  handleSettingsUpdate({
                                    autoBackup: !adminSettings.autoBackup,
                                  })
                                }
                                disabled={settingsLoading}
                              >
                                {settingsLoading ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                {adminSettings.autoBackup
                                  ? 'Enabled'
                                  : 'Disabled'}
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Debug Mode
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Enable detailed logging for troubleshooting
                                </p>
                              </div>
                              <Button
                                variant={
                                  adminSettings.debugMode
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                size="sm"
                                onClick={() =>
                                  handleSettingsUpdate({
                                    debugMode: !adminSettings.debugMode,
                                  })
                                }
                                disabled={settingsLoading}
                              >
                                {settingsLoading ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                {adminSettings.debugMode
                                  ? 'Enabled'
                                  : 'Disabled'}
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Rate Limit
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  API requests per minute per user
                                </p>
                              </div>
                              <Input
                                type="number"
                                value={adminSettings.rateLimit}
                                onChange={(e) =>
                                  handleSettingsUpdate({
                                    rateLimit:
                                      Number.parseInt(e.target.value) || 1000,
                                  })
                                }
                                className="w-24 bg-muted/50 border-border text-foreground"
                                disabled={settingsLoading}
                                min="100"
                                max="10000"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  System Maintenance
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Enable maintenance mode for updates
                                </p>
                              </div>
                              <Button
                                variant={
                                  maintenanceMode ? 'destructive' : 'secondary'
                                }
                                size="sm"
                                onClick={handleMaintenanceToggle}
                                disabled={maintenanceLoading}
                              >
                                {maintenanceLoading ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                {maintenanceMode ? 'Enabled' : 'Disabled'}
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Refresh Data
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Manually refresh all dashboard data
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  fetchOverviewStats();
                                  fetchUsers();
                                  fetchTickets();
                                  fetchAnalytics();
                                  fetchMaintenanceStatus();
                                  toast.success('Data refreshed successfully');
                                }}
                                disabled={
                                  statsLoading ||
                                  usersLoading ||
                                  ticketsLoading ||
                                  analyticsLoading
                                }
                              >
                                {statsLoading ||
                                usersLoading ||
                                ticketsLoading ||
                                analyticsLoading ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : (
                                  <RefreshCw className="size-3 mr-1" />
                                )}
                                Refresh
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog
        open={!!deleteDialogOpen}
        onOpenChange={() => setDeleteDialogOpen(undefined)}
      >
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the
              user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialogOpen && handleDeleteUser(deleteDialogOpen)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Reply Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="bg-background border-border max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Ticket: {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and respond to support request
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Ticket Details */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedTicket.type === 'bug'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {selectedTicket.type}
                    </Badge>
                    <Badge
                      variant={
                        selectedTicket.priority === 'urgent'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {selectedTicket.priority}
                    </Badge>
                    <Badge
                      variant={
                        selectedTicket.status === 'open' ? 'default' : 'outline'
                      }
                    >
                      {getStatusText(selectedTicket.status)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>
                <h4 className="font-medium text-foreground mb-2">
                  {selectedTicket.subject}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTicket.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-4" />
                  {selectedTicket.user?.name || selectedTicket.user?.email}
                </div>
              </div>

              {/* Correspondence History */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-64">
                <h5 className="text-sm font-medium text-foreground">
                  Correspondence History
                </h5>
                {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                  selectedTicket.replies.map((reply: any, index: number) => (
                    <div
                      key={reply.id || index}
                      className={`p-3 rounded-lg border ${
                        reply.isAdminReply
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-6 rounded-full flex items-center justify-center ${
                              reply.isAdminReply
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-green-500/10 text-green-600 dark:text-green-400'
                            }`}
                          >
                            {reply.isAdminReply ? (
                              <Shield className="size-3" />
                            ) : (
                              <User className="size-3" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {reply.isAdminReply
                              ? 'Admin'
                              : reply.user?.name || reply.user?.email}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{reply.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No replies yet</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="border-t border-border/50 pt-4">
                <label
                  htmlFor="reply-textarea"
                  className="text-sm font-medium text-foreground mb-2 block"
                >
                  Your Reply
                </label>
                <Textarea
                  id="reply-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter your response..."
                  rows={3}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground mb-3"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReplyToTicket}
                    disabled={!replyText.trim() || replying}
                  >
                    {replying ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
