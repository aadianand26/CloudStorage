import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ArrowUpRight,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStorageStats } from "@/hooks/useStorageStats";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { ACCEPT_STRING, useWorkspaceUpload } from "@/hooks/useWorkspaceUpload";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, end: true },
  { title: "My Files", url: "/documents", icon: FileText },
  { title: "Shared", url: "/shared", icon: Share2 },
  { title: "Recent", url: "/recent", icon: Clock },
  { title: "Starred", url: "/starred", icon: Star },
  { title: "Trash", url: "/trash", icon: Trash2 },
];

const toolItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Sparkles },
  { title: "Smart Search", url: "/smart-search", icon: Search },
  { title: "Sync", url: "/sync", icon: RefreshCw },
  { title: "Security", url: "/security", icon: Shield },
];

const accountItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const quickActions = [
  { title: "Upload Files", subtitle: "Add and organize documents", url: "/documents", icon: Upload },
  { title: "Upgrade Plan", subtitle: "Unlock more storage", url: "/pricing", icon: ArrowUpRight },
];

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

export function AppSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { handleFileSelect } = useWorkspaceUpload();
  const collapsed = !open;
  const {
    percentage,
    loading: storageLoading,
    usedFormatted,
    limitFormatted,
    fileCount,
    isWarning,
  } = useStorageStats();

  useEffect(() => {
    if (isWarning && !storageLoading) {
      toast({
        title: "Storage Warning",
        description: `You've used ${percentage}% of your 5 MB storage limit. Consider deleting unused files.`,
        variant: "destructive",
      });
    }
  }, [isWarning, percentage, storageLoading, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuickActionClick = (action: (typeof quickActions)[number]) => {
    if (action.title === "Upload Files") {
      fileInputRef.current?.click();
      return;
    }

    navigate(action.url);
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "JS";
  const userName = user?.user_metadata?.display_name || "John Smith";
  const storageTone = isWarning
    ? "text-destructive"
    : percentage >= 50
      ? "text-amber-700"
      : "text-sidebar-foreground";

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <NavLink to={item.url} end={item.end} title={collapsed ? item.title : undefined}>
        {({ isActive }) => (
          <div
            className={cn(
              "group flex items-center rounded-xl border px-3 py-2.5 transition-all duration-200",
              collapsed ? "justify-center px-0 py-2.5" : "gap-3",
              isActive
                ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "border-transparent bg-transparent text-sidebar-foreground hover:border-sidebar-border hover:bg-white/55 hover:shadow-sm",
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
              )}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
                  )}
                >
                  {item.title}
                </span>
              </div>
            )}
          </div>
        )}
      </NavLink>
    </SidebarMenuItem>
  );

  const renderQuickAction = (action: (typeof quickActions)[number]) => (
    <button
      key={action.title}
      type="button"
      onClick={() => handleQuickActionClick(action)}
      className={cn(
        "w-full rounded-2xl border border-sidebar-border bg-white/70 text-left transition-all hover:-translate-y-0.5 hover:border-sidebar-primary/30 hover:bg-white hover:shadow-md",
        collapsed ? "flex items-center justify-center p-3" : "p-3.5",
      )}
      title={collapsed ? action.title : undefined}
    >
      {collapsed ? (
        <action.icon className="h-4 w-4 text-sidebar-foreground" />
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <action.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground">{action.title}</p>
            <p className="line-clamp-2 text-xs leading-5 text-sidebar-foreground/70">{action.subtitle}</p>
          </div>
        </div>
      )}
    </button>
  );

  return (
    <Sidebar className={collapsed ? "w-16" : "w-[17.5rem] max-w-[85vw]"} collapsible="icon">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />

      <SidebarHeader className="border-b border-sidebar-border bg-white/35 p-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}>
          <BrandLogo
            showText={!collapsed}
            text="Clever Vault"
            className={cn("gap-2", collapsed && "justify-center")}
            imageClassName="h-8 w-8"
            textClassName="text-lg font-bold text-sidebar-foreground"
          />
          {!collapsed && <Badge className="bg-sidebar-primary/10 text-sidebar-foreground hover:bg-sidebar-primary/10">Workspace</Badge>}
        </div>
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll gap-3 overflow-x-hidden px-3 py-4">
        {!collapsed && (
          <div className="rounded-3xl border border-sidebar-border bg-white/78 p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-sidebar-primary/10">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
                  <Badge variant="secondary" className="bg-accent text-sidebar-foreground">
                    Pro
                  </Badge>
                </div>
                <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-sidebar/70 p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-sidebar-foreground/75">Storage usage</span>
                <span className={cn("font-semibold", storageTone)}>
                  {storageLoading ? "..." : `${percentage}%`}
                </span>
              </div>
              <Progress value={percentage} className="h-2.5" />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/80 p-2.5">
                  <p className="text-sidebar-foreground/60">Used</p>
                  <p className="mt-1 font-semibold text-sidebar-foreground">
                    {storageLoading ? "..." : usedFormatted}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-2.5">
                  <p className="text-sidebar-foreground/60">Files</p>
                  <p className="mt-1 font-semibold text-sidebar-foreground">
                    {storageLoading ? "..." : fileCount}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-sidebar-foreground/70">
                {storageLoading ? "Loading storage..." : `${usedFormatted} of ${limitFormatted} available plan space`}
              </p>
            </div>
          </div>
        )}

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/65">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map(renderQuickAction)}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="rounded-3xl border border-sidebar-border bg-white/55 p-3">
          <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/65">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="rounded-3xl border border-sidebar-border bg-white/55 p-3">
          <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/65">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {toolItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="rounded-3xl border border-sidebar-border bg-white/55 p-3">
          <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/65">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {accountItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-white/35 p-3">
        {collapsed ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => navigate("/help")}
              title="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/help")}
              className="flex w-full items-center justify-between rounded-2xl border border-sidebar-border bg-white/70 px-3 py-3 text-left transition-all hover:border-sidebar-primary/30 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sidebar-foreground">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">Help Center</p>
                  <p className="text-xs text-sidebar-foreground/70">Support and docs</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-sidebar-foreground/50" />
            </button>

            <Button
              variant="ghost"
              className="h-11 w-full justify-start rounded-2xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
