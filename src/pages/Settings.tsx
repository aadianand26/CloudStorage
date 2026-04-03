import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import {
  BellRing,
  Briefcase,
  Palette,
  Settings as SettingsIcon,
  Sparkles,
  UserCircle2,
} from "lucide-react";

const Settings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState({
    display_name: "",
    workspace_name: "",
    role: "",
    plan: "",
  });
  const { toast } = useToast();
  const { activeFiles, totalSizeLabel } = useWorkspaceFiles();
  const { profile, saving, updateProfile } = useWorkspaceProfile();

  useEffect(() => {
    if (!profile) return;
    setFormState({
      display_name: profile.display_name ?? "",
      workspace_name: profile.workspace_name ?? "Clever Vault",
      role: profile.role ?? "Owner",
      plan: profile.plan ?? "Pro",
    });
  }, [profile]);

  const saveProfile = async () => {
    try {
      await updateProfile({
        display_name: formState.display_name,
        workspace_name: formState.workspace_name,
        role: formState.role,
        plan: formState.plan,
      });
      toast({
        title: "Settings saved",
        description: "Your workspace details were updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Save failed",
        description: "Could not save your workspace settings.",
        variant: "destructive",
      });
    }
  };

  const resetLayout = async () => {
    try {
      await updateProfile({
        compact_dashboard: false,
        upload_suggestions: true,
        weekly_digest: true,
      });
      toast({
        title: "Defaults restored",
        description: "Layout-related workspace settings were reset.",
      });
    } catch (error) {
      console.error("Failed to reset layout:", error);
      toast({
        title: "Reset failed",
        description: "Could not restore the default preferences.",
        variant: "destructive",
      });
    }
  };

  const togglePreference = async (
    field: "compact_dashboard" | "upload_suggestions" | "weekly_digest",
    value: boolean,
  ) => {
    try {
      await updateProfile({ [field]: value });
      toast({
        title: "Preference updated",
        description: "Your experience setting has been saved.",
      });
    } catch (error) {
      console.error("Failed to update preference:", error);
      toast({
        title: "Update failed",
        description: "Could not save that preference.",
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
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Workspace Settings</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Shape the workspace around your team, your brand, and the way you actually
                        review, upload, and share files every day.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void saveProfile()} disabled={saving}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                      <Button variant="outline" className="bg-white/70" onClick={() => void resetLayout()} disabled={saving}>
                        Reset Layout
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <SettingsIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Profile Snapshot</p>
                        <p className="text-xs text-muted-foreground">Live details from your connected profile</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plan</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{profile?.plan ?? "Pro"}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {profile?.workspace_name ?? "Clever Vault"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Storage</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{totalSizeLabel}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Files</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{activeFiles.length}</p>
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
                    <UserCircle2 className="h-5 w-5 text-primary" />
                    Profile & Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={formState.display_name}
                      onChange={(event) => setFormState((current) => ({ ...current, display_name: event.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace name</Label>
                    <Input
                      id="workspace-name"
                      value={formState.workspace_name}
                      onChange={(event) => setFormState((current) => ({ ...current, workspace_name: event.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formState.role}
                      onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Input
                      id="plan"
                      value={formState.plan}
                      onChange={(event) => setFormState((current) => ({ ...current, plan: event.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Experience Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Compact dashboard widgets</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use denser card layouts for busy workspaces.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.compact_dashboard ?? false}
                      disabled={saving}
                      onCheckedChange={(value) => void togglePreference("compact_dashboard", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Show upload suggestions</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Recommend folders and tags when new files are added.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.upload_suggestions ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void togglePreference("upload_suggestions", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Weekly digest</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Receive a summary of storage and account activity.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.weekly_digest ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void togglePreference("weekly_digest", value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Quick Preference Areas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    icon: Palette,
                    title: "Interface Style",
                    description: "Warm light workspace with softer surfaces and stronger readability.",
                  },
                  {
                    icon: Briefcase,
                    title: "Workspace Identity",
                    description: `${profile?.workspace_name ?? "Clever Vault"} is configured as a ${profile?.plan ?? "Pro"} workspace.`,
                  },
                  {
                    icon: BellRing,
                    title: "Notification Rhythm",
                    description: profile?.weekly_digest
                      ? "Weekly summaries are enabled for workspace activity."
                      : "Notification summaries are currently muted.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
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

export default Settings;
