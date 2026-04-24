import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  AccountInformationSection,
  ActivityHistorySection,
  AppearanceSettingsSection,
  ConnectedDevicesSection,
  HelpSupportSection,
  NotificationSettingsSection,
  SecurityPrivacySection,
  SettingsCategorySidebar,
  SharingSettingsSection,
  StorageManagementSection,
  UploadPreferencesSection,
  type ActivityInfo,
  type SessionInfo,
  type SettingSectionId,
  type SettingsState,
  type StorageBreakdownItem,
} from "@/components/settings/SettingsPageSections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceActivity } from "@/hooks/useDeviceActivity";
import { useStorageStats } from "@/hooks/useStorageStats";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { formatBytes, isDocumentFile, isImageFile, isVideoFile } from "@/lib/file-utils";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import { Cloud, Save } from "lucide-react";

const SETTINGS_STORAGE_KEY = "clever-vault-settings";
const PROFILE_IMAGE_KEY = "clever-vault-profile-picture";

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "Not available");

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "not available";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return new Date(value).toLocaleDateString();
};

const defaultSettings: SettingsState = {
  profileName: "",
  email: "",
  defaultSharingPermission: "viewer",
  publicLinkSharing: true,
  passwordProtectedSharing: true,
  linkExpirationDefault: "30",
  autoSync: true,
  resumeUploads: true,
  overwriteConfirmation: true,
  defaultUploadFolder: "my-files",
  trashRetentionDays: "30",
  uploadSuccessAlerts: true,
  fileSharedAlerts: true,
  storageAlmostFullAlert: true,
  loginAlerts: true,
  weeklySummaryEmail: true,
  twoFactorEnabled: true,
  darkMode: false,
  fontSize: "medium",
  language: "en",
};

const Settings = () => {
  const [, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<SettingSectionId>("account");
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    devices,
    loginActivity,
    currentDeviceId,
    removeDevice,
    removeOtherDevices,
  } = useDeviceActivity();
  const { activeFiles, sharedFiles, deletedFiles } = useWorkspaceFiles();
  const { profile, saving, updateProfile } = useWorkspaceProfile();
  const { totalSize, storageLimit, percentage, usedFormatted, limitFormatted } = useStorageStats();

  useEffect(() => {
    const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const savedPicture = window.localStorage.getItem(PROFILE_IMAGE_KEY);

    if (savedSettings) {
      try {
        setSettings((current) => ({
          ...current,
          ...JSON.parse(savedSettings),
        }));
      } catch {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
    }

    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  useEffect(() => {
    setSettings((current) => ({
      ...current,
      profileName: current.profileName || profile?.display_name || user?.user_metadata?.display_name || "",
      email: current.email || user?.email || "",
      twoFactorEnabled: profile?.two_factor_enabled ?? current.twoFactorEnabled,
      passwordProtectedSharing: profile?.protected_share_links ?? current.passwordProtectedSharing,
      weeklySummaryEmail: profile?.weekly_digest ?? current.weeklySummaryEmail,
    }));
  }, [
    profile?.display_name,
    profile?.protected_share_links,
    profile?.two_factor_enabled,
    profile?.weekly_digest,
    user?.email,
    user?.user_metadata?.display_name,
  ]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.darkMode);
    document.documentElement.style.fontSize =
      settings.fontSize === "large" ? "17px" : settings.fontSize === "small" ? "15px" : "16px";
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));

    if (key === "twoFactorEnabled") {
      void updateProfile({ two_factor_enabled: Boolean(value) }).catch(() => showSaveError());
    }

    if (key === "passwordProtectedSharing") {
      void updateProfile({ protected_share_links: Boolean(value) }).catch(() => showSaveError());
    }

    if (key === "weeklySummaryEmail") {
      void updateProfile({ weekly_digest: Boolean(value) }).catch(() => showSaveError());
    }
  };

  const showSaveError = () => {
    toast({
      title: "Cloud save failed",
      description: "The local setting was saved, but the cloud profile update did not complete.",
      variant: "destructive",
    });
  };

  const handleSectionSelect = (id: SettingSectionId) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result);
      setProfilePicture(image);
      window.localStorage.setItem(PROFILE_IMAGE_KEY, image);
      toast({ title: "Profile picture saved", description: "Your profile image was saved locally." });
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    window.localStorage.removeItem(PROFILE_IMAGE_KEY);
    toast({ title: "Profile picture removed", description: "The local profile image was cleared." });
  };

  const updateAccountDetails = async () => {
    setAccountSaving(true);
    try {
      if (settings.profileName.trim()) {
        await updateProfile({ display_name: settings.profileName.trim() });
      }

      if (hasSupabaseConfig && user && settings.email.trim() && settings.email.trim() !== user.email) {
        await supabase.auth.updateUser({ email: settings.email.trim() });
      }

      toast({
        title: "Account updated",
        description: "Your account information has been saved.",
      });
    } catch (error) {
      console.error("Failed to update account:", error);
      toast({
        title: "Account update failed",
        description: "Could not save those account details.",
        variant: "destructive",
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleChangePassword = () => {
    toast({
      title: "Password change",
      description: "Use the account recovery flow or connect a dedicated password form for production updates.",
    });
  };

  const logoutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({
        title: "Logged out everywhere",
        description: "All sessions were signed out successfully.",
      });
    } catch (error) {
      console.error("Failed to logout from all devices:", error);
      toast({
        title: "Logout failed",
        description: "Could not log out all devices right now.",
        variant: "destructive",
      });
    }
  };

  const logoutOtherDevices = async () => {
    try {
      await removeOtherDevices();
      toast({
        title: "Other devices removed",
        description: "Other tracked devices were removed from your backend device list.",
      });
    } catch (error) {
      console.error("Failed to remove other devices:", error);
      toast({
        title: "Device update failed",
        description: "Could not remove other devices right now.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = () => {
    toast({
      title: "Delete account requested",
      description: "Connect a backend delete endpoint to permanently remove the user account and files.",
      variant: "destructive",
    });
  };

  const storageBreakdown = useMemo<StorageBreakdownItem[]>(() => {
    const images = activeFiles.filter((file) => isImageFile(file.type)).reduce((sum, file) => sum + file.size, 0);
    const videos = activeFiles.filter((file) => isVideoFile(file.type)).reduce((sum, file) => sum + file.size, 0);
    const documents = activeFiles.filter((file) => isDocumentFile(file.type)).reduce((sum, file) => sum + file.size, 0);
    const knownTotal = images + videos + documents;
    const others = Math.max(totalSize - knownTotal, 0);
    const percentOfTotal = (value: number) => (totalSize > 0 ? Math.round((value / totalSize) * 100) : 0);

    return [
      { label: "Images", bytes: images, percent: percentOfTotal(images), tone: "bg-emerald-500" },
      { label: "Videos", bytes: videos, percent: percentOfTotal(videos), tone: "bg-sky-500" },
      { label: "Documents", bytes: documents, percent: percentOfTotal(documents), tone: "bg-amber-500" },
      { label: "Others", bytes: others, percent: percentOfTotal(others), tone: "bg-stone-500" },
    ];
  }, [activeFiles, totalSize]);

  const remainingStorage = Math.max(storageLimit - totalSize, 0);

  const connectedDevices = useMemo(
    () =>
      devices.map((device) => ({
        id: device.id,
        name: device.device_name,
        lastActive: formatRelativeTime(device.last_active_at),
      })),
    [devices],
  );

  const sessions = useMemo<SessionInfo[]>(
    () =>
      devices.map((device) => ({
        id: device.id,
        name: device.device_name,
        location: [device.os, device.browser].filter(Boolean).join(" - ") || "Tracked device",
        lastActive: formatRelativeTime(device.last_active_at),
        current: device.id === currentDeviceId,
      })),
    [currentDeviceId, devices],
  );

  const activities = useMemo<ActivityInfo[]>(() => {
    const fileActivities = activeFiles.slice(0, 4).map((file, index) => ({
      id: `upload-${file.id}`,
      action: "File upload",
      detail: file.name,
      timestamp: formatDateTime(file.created_at),
      device: sessions[0]?.name ?? (index % 2 === 0 ? "Web browser" : "Desktop sync"),
      status: "Completed",
    }));

    const deletedActivities = deletedFiles.slice(0, 2).map((file) => ({
      id: `delete-${file.id}`,
      action: "File delete",
      detail: file.name,
      timestamp: formatDateTime(file.deleted_at ?? file.updated_at),
      device: sessions[0]?.name ?? "Web browser",
      status: "Completed",
    }));

    const sharedActivities = sharedFiles.slice(0, 2).map((file) => ({
      id: `share-${file.id}`,
      action: "File share",
      detail: file.name,
      timestamp: formatDateTime(file.updated_at),
      device: sessions[0]?.name ?? "Web browser",
      status: "Completed",
    }));

    const loginActivities = loginActivity.map((activity) => ({
      id: `login-${activity.id}`,
      action: "Login attempt",
      detail: `${activity.status === "successful" ? "Successful" : "Recorded"} ${activity.event_type}`,
      timestamp: formatDateTime(activity.created_at),
      device: activity.device_name,
      status: activity.status === "successful" ? "Successful" : activity.status,
    }));

    return [
      ...loginActivities,
      ...fileActivities,
      ...deletedActivities,
      ...sharedActivities,
    ].slice(0, 10);
  }, [activeFiles, deletedFiles, loginActivity, sessions, sharedFiles]);

  const accountCreatedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString()
      : "Not available";

  const lastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Not available";

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <Card className="glass-card overflow-hidden border-0">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Cloud Storage Settings</Badge>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                      A complete dashboard control center for account details, storage, security, sharing, uploads,
                      notifications, devices, appearance, activity, and support.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="bg-white/80" disabled={saving || accountSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      Auto-save on
                    </Button>
                    <Button onClick={() => toast({ title: "Upgrade plan", description: "Mock upgrade flow opened." })}>
                      <Cloud className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
              <SettingsCategorySidebar activeSection={activeSection} onSelect={handleSectionSelect} />

              <div className="space-y-6">
                <AccountInformationSection
                  settings={settings}
                  profilePicture={profilePicture}
                  createdAt={accountCreatedAt}
                  lastLogin={lastLogin}
                  accountSaving={accountSaving}
                  onSettingChange={updateSetting}
                  onProfilePictureChange={handleProfilePictureChange}
                  onRemoveProfilePicture={removeProfilePicture}
                  onUpdateAccount={() => void updateAccountDetails()}
                  onChangePassword={handleChangePassword}
                  onLogoutAllDevices={() => void logoutAllDevices()}
                  onDeleteAccount={deleteAccount}
                />

                <StorageManagementSection
                  totalCapacity={limitFormatted}
                  usedStorage={usedFormatted}
                  remainingStorage={formatBytes(remainingStorage)}
                  usagePercent={percentage}
                  breakdown={storageBreakdown}
                  onUpgrade={() => toast({ title: "Upgrade storage plan", description: "Mock billing plan selector opened." })}
                />

                <SecurityPrivacySection
                  twoFactorEnabled={settings.twoFactorEnabled}
                  sessions={sessions}
                  loginActivity={activities.filter((activity) => activity.action === "Login attempt")}
                  onToggleTwoFactor={(checked) => updateSetting("twoFactorEnabled", checked)}
                  onChangePassword={handleChangePassword}
                  onLogoutOtherDevices={logoutOtherDevices}
                />

                <SharingSettingsSection settings={settings} onSettingChange={updateSetting} />
                <UploadPreferencesSection settings={settings} onSettingChange={updateSetting} />
                <NotificationSettingsSection settings={settings} onSettingChange={updateSetting} />
                <ConnectedDevicesSection
                  devices={connectedDevices}
                  onRemoveDevice={(id) => {
                    void removeDevice(id)
                      .then(() => {
                        toast({
                          title: "Device removed",
                          description: "The device was removed from your backend device list.",
                        });
                      })
                      .catch((error) => {
                        console.error("Failed to remove device:", error);
                        toast({
                          title: "Remove failed",
                          description: "Could not remove that device right now.",
                          variant: "destructive",
                        });
                      });
                  }}
                />
                <AppearanceSettingsSection settings={settings} onSettingChange={updateSetting} />
                <ActivityHistorySection activities={activities} />
                <HelpSupportSection appVersion="Clever Vault 1.0.0" />
              </div>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Settings;
