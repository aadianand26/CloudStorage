import { useMemo, useState } from "react";
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
import {
  BellRing,
  CheckCircle2,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Shield,
} from "lucide-react";

const Security = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeFiles, sharedFiles, protectedShares, deletedFiles, recentFiles } = useWorkspaceFiles();
  const { profile, saving, updateProfile } = useWorkspaceProfile();

  const protectionScore = useMemo(() => {
    const score = [
      profile?.two_factor_enabled ? 35 : 0,
      profile?.suspicious_activity_alerts ? 25 : 0,
      profile?.protected_share_links ? 20 : 0,
      protectedShares.length > 0 ? 10 : 0,
      deletedFiles.length >= 0 ? 10 : 0,
    ].reduce((sum, value) => sum + value, 0);

    return Math.min(100, score);
  }, [
    deletedFiles.length,
    profile?.protected_share_links,
    profile?.suspicious_activity_alerts,
    profile?.two_factor_enabled,
    protectedShares.length,
  ]);

  const updateSecuritySetting = async (
    field: "two_factor_enabled" | "suspicious_activity_alerts" | "protected_share_links",
    value: boolean,
  ) => {
    try {
      await updateProfile({ [field]: value });
      toast({
        title: "Security updated",
        description: "Your workspace protection setting has been saved.",
      });
    } catch (error) {
      console.error("Failed to update security setting:", error);
      toast({
        title: "Update failed",
        description: "Could not save that security preference.",
        variant: "destructive",
      });
    }
  };

  const recentSecurityEvents = [
    {
      title: "Protected share links",
      description: `${protectedShares.length} shared files currently use expiry or password protection.`,
    },
    {
      title: "Shared workspace exposure",
      description: `${sharedFiles.length} files are shared right now and should be reviewed regularly.`,
    },
    {
      title: "Recent workspace changes",
      description: `${recentFiles.length} files changed recently, which helps flag active folders for access review.`,
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <Card className="glass-card overflow-hidden border-0">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Account Protection</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Security Center</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Review live sharing exposure, tighten your protection defaults, and save
                        real security preferences back to the connected Supabase profile.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => navigate("/shared")}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Review Access
                      </Button>
                      <Button variant="outline" className="bg-white/70" onClick={() => navigate("/settings")}>
                        <BellRing className="mr-2 h-4 w-4" />
                        Alert Settings
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Protection Score</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Calculated from live share exposure and saved workspace settings
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                        {protectionScore} / 100
                      </div>
                    </div>
                    <Progress value={protectionScore} className="mt-5 h-2.5 bg-secondary/80" />
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">2FA</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {profile?.two_factor_enabled ? "Enabled" : "Off"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shares</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{sharedFiles.length} active</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Protected</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{protectedShares.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: Fingerprint,
                      title: "Two-factor protection",
                      description: profile?.two_factor_enabled
                        ? "Account sign-in is protected by a second verification step."
                        : "Enable 2FA to improve account protection immediately.",
                    },
                    {
                      icon: LockKeyhole,
                      title: "Protected sharing",
                      description: `${protectedShares.length} links currently use expiry or password-based controls.`,
                    },
                    {
                      icon: EyeOff,
                      title: "Workspace visibility",
                      description: `${activeFiles.length - sharedFiles.length} files remain private to your account.`,
                    },
                  ].map((signal) => (
                    <div key={signal.title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <signal.icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">{signal.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{signal.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Security Defaults</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Require a second verification step for account access.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.two_factor_enabled ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void updateSecuritySetting("two_factor_enabled", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Suspicious activity alerts</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get warned about unexpected sharing or unusual account activity.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.suspicious_activity_alerts ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void updateSecuritySetting("suspicious_activity_alerts", value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Protected share links</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Encourage expiry and password protection on shared files by default.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.protected_share_links ?? true}
                      disabled={saving}
                      onCheckedChange={(value) => void updateSecuritySetting("protected_share_links", value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Recent Security Activity</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3">
                {recentSecurityEvents.map((event) => (
                  <div key={event.title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
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

export default Security;
