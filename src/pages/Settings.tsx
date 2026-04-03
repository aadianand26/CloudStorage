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
import { useAuth } from "@/hooks/useAuth";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import {
  BellRing,
  Briefcase,
  KeyRound,
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
  const [accountState, setAccountState] = useState({
    displayName: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const { toast } = useToast();
  const { activeFiles, totalSizeLabel } = useWorkspaceFiles();
  const { profile, saving, updateProfile } = useWorkspaceProfile();
  const { user } = useAuth();

  useEffect(() => {
    if (!profile) return;
    setFormState({
      display_name: profile.display_name ?? "",
      workspace_name: profile.workspace_name ?? "Clever Vault",
      role: profile.role ?? "Owner",
      plan: profile.plan ?? "Pro",
    });
  }, [profile]);

  useEffect(() => {
    setAccountState((current) => ({
      ...current,
      displayName: profile?.display_name ?? user?.user_metadata?.display_name ?? "",
    }));
  }, [profile?.display_name, user?.user_metadata?.display_name]);

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

  const updateAccountProfile = async () => {
    if (!hasSupabaseConfig) {
      toast({
        title: "Supabase not configured",
        description: "Please configure environment variables and redeploy to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setAccountSaving(true);
    try {
      const displayName = accountState.displayName.trim();
      if (!displayName) {
        toast({
          title: "Display name required",
          description: "Please enter a display name before saving.",
          variant: "destructive",
        });
        return;
      }

      await supabase.auth.updateUser({
        data: {
          display_name: displayName,
        },
      });
      await updateProfile({ display_name: displayName });
      toast({
        title: "Profile updated",
        description: "Your display name has been updated.",
      });
    } catch (error) {
      console.error("Failed to update account profile:", error);
      toast({
        title: "Update failed",
        description: "Could not update your profile details.",
        variant: "destructive",
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!hasSupabaseConfig) {
      toast({
        title: "Supabase not configured",
        description: "Please configure environment variables and redeploy to change your password.",
        variant: "destructive",
      });
      return;
    }

    const newPassword = accountState.newPassword.trim();
    const confirmPassword = accountState.confirmPassword.trim();

    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setAccountSaving(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      setAccountState((current) => ({ ...current, newPassword: "", confirmPassword: "" }));
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error("Failed to update password:", error);
      toast({
        title: "Password update failed",
        description: "Could not change your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccountSaving(false);
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

              <div className="space-y-6">
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

                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Account & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-email">Email</Label>
                      <Input
                        id="account-email"
                        value={user?.email ?? "Not available"}
                        readOnly
                        className="bg-white/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-display-name">Display name</Label>
                      <Input
                        id="account-display-name"
                        value={accountState.displayName}
                        onChange={(event) =>
                          setAccountState((current) => ({ ...current, displayName: event.target.value }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <Button
                      onClick={() => void updateAccountProfile()}
                      disabled={accountSaving || saving}
                      variant="outline"
                      className="w-full bg-white/80"
                    >
                      Update Profile
                    </Button>

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={accountState.newPassword}
                          onChange={(event) =>
                            setAccountState((current) => ({ ...current, newPassword: event.target.value }))
                          }
                          className="bg-white/80"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={accountState.confirmPassword}
                          onChange={(event) =>
                            setAccountState((current) => ({ ...current, confirmPassword: event.target.value }))
                          }
                          className="bg-white/80"
                        />
                      </div>
                    </div>
                    <Button onClick={() => void updatePassword()} disabled={accountSaving} className="w-full">
                      Change Password
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Changing your password will keep you signed in on this device.
                    </p>
                  </CardContent>
                </Card>
              </div>
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
