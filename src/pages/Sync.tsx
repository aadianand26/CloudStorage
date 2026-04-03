import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { formatBytes } from "@/lib/file-utils";
import {
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  FolderKanban,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";

const Sync = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    activeFiles,
    documents,
    images,
    recentFiles,
    totalSize,
    refetch: refetchFiles,
  } = useWorkspaceFiles();
  const { profile, saving, refetch: refetchProfile, updateProfile } = useWorkspaceProfile();

  const syncCoverage = activeFiles.length === 0 ? 0 : Math.min(100, 62 + recentFiles.length * 6);

  const runSyncRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchFiles(), refetchProfile()]);
      toast({
        title: "Workspace refreshed",
        description: "Live file and sync data were refreshed from Supabase.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (
    field: "wifi_only_uploads" | "upload_suggestions" | "weekly_digest",
    value: boolean,
  ) => {
    try {
      await updateProfile({ [field]: value });
      toast({
        title: "Preference updated",
        description: "Your sync preference has been saved.",
      });
    } catch (error) {
      console.error("Failed to update sync preference:", error);
      toast({
        title: "Update failed",
        description: "Could not save that sync preference.",
        variant: "destructive",
      });
    }
  };

  const setSyncWindow = async (minutes: number) => {
    try {
      await updateProfile({ sync_window_minutes: minutes });
      toast({
        title: "Sync window updated",
        description: `The workspace now uses a ${minutes}-minute sync window.`,
      });
    } catch (error) {
      console.error("Failed to update sync window:", error);
      toast({
        title: "Update failed",
        description: "Could not save the sync window.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="px-3 pb-8 pt-4 md:px-6 md:pb-12 md:pt-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <Card className="glass-card overflow-hidden border-0">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Workspace Sync</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Sync Center</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Monitor real workspace activity, refresh live storage data, and save sync
                        preferences directly into your connected Supabase profile.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void runSyncRefresh()} disabled={refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Sync Now
                      </Button>
                      <Button variant="outline" className="bg-white/70" onClick={() => navigate("/documents")}>
                        <FolderKanban className="mr-2 h-4 w-4" />
                        Manage Folders
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Workspace Coverage</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Based on current file activity and sync preference health
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                        {syncCoverage}%
                      </div>
                    </div>
                    <Progress value={syncCoverage} className="mt-5 h-2.5 bg-secondary/80" />
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Files</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{activeFiles.length}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{recentFiles.length}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Window</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {profile?.sync_window_minutes ?? 15} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-primary" />
                    Live Workspace Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: HardDrive,
                      label: "Stored files",
                      value: `${activeFiles.length} tracked`,
                      description: `${formatBytes(totalSize)} currently stored in your vault.`,
                    },
                    {
                      icon: FolderKanban,
                      label: "Documents",
                      value: `${documents.length} indexed`,
                      description: "Document-heavy uploads are ready for search and AI summaries.",
                    },
                    {
                      icon: Wifi,
                      label: "Images",
                      value: `${images.length} indexed`,
                      description: "Image uploads can be refreshed and prepared for OCR-backed actions.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{item.value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Sync Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Wi-Fi only uploads</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep large uploads for stable connections.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.wifi_only_uploads ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void handleToggle("wifi_only_uploads", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Upload suggestions</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Recommend folders and tags while new files arrive.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.upload_suggestions ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void handleToggle("upload_suggestions", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Weekly digest</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Receive a summary of storage and sync activity.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.weekly_digest ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void handleToggle("weekly_digest", value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Sync window</p>
                    <div className="flex flex-wrap gap-2">
                      {[15, 30, 60].map((minutes) => (
                        <Button
                          key={minutes}
                          type="button"
                          variant={profile?.sync_window_minutes === minutes ? "default" : "outline"}
                          className="bg-white/70"
                          disabled={saving}
                          onClick={() => void setSyncWindow(minutes)}
                        >
                          {minutes} min
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Activity Shortcuts</CardTitle>
                <Button variant="outline" className="w-full bg-white/70 sm:w-auto" onClick={() => navigate("/recent")}>
                  Open Activity Log
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3">
                {[
                  ["Recent uploads", `${recentFiles.length} files changed in the last 7 days.`],
                  ["Search-ready files", `${documents.length + images.length} files can feed search or AI tools.`],
                  ["Saved profile sync rules", `Sync window set to ${profile?.sync_window_minutes ?? 15} minutes.`],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Sync;
