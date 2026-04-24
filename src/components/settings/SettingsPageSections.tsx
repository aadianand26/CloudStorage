import { ChangeEvent, ReactNode, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Cloud,
  Contact,
  Database,
  HelpCircle,
  KeyRound,
  Laptop,
  Link2,
  LogOut,
  MonitorSmartphone,
  Moon,
  Palette,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/file-utils";

export type SelectOption = {
  value: string;
  label: string;
};

export type SettingsState = {
  profileName: string;
  email: string;
  defaultSharingPermission: string;
  publicLinkSharing: boolean;
  passwordProtectedSharing: boolean;
  linkExpirationDefault: string;
  autoSync: boolean;
  resumeUploads: boolean;
  overwriteConfirmation: boolean;
  defaultUploadFolder: string;
  trashRetentionDays: string;
  uploadSuccessAlerts: boolean;
  fileSharedAlerts: boolean;
  storageAlmostFullAlert: boolean;
  loginAlerts: boolean;
  weeklySummaryEmail: boolean;
  twoFactorEnabled: boolean;
  darkMode: boolean;
  fontSize: string;
  language: string;
};

export type DeviceInfo = {
  id: string;
  name: string;
  lastActive: string;
};

export type SessionInfo = DeviceInfo & {
  location: string;
  current?: boolean;
};

export type ActivityInfo = {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  device: string;
  status: string;
};

export type StorageBreakdownItem = {
  label: string;
  bytes: number;
  percent: number;
  tone: string;
};

export type SettingSectionId =
  | "account"
  | "storage"
  | "security"
  | "sharing"
  | "uploads"
  | "notifications"
  | "devices"
  | "appearance"
  | "activity"
  | "support";

export type SettingsSectionNavItem = {
  id: SettingSectionId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SectionCardProps = {
  id: SettingSectionId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
};

const settingsNavItems: SettingsSectionNavItem[] = [
  { id: "account", title: "Account", icon: UserRound },
  { id: "storage", title: "Storage", icon: Database },
  { id: "security", title: "Security", icon: ShieldCheck },
  { id: "sharing", title: "Sharing", icon: Link2 },
  { id: "uploads", title: "Uploads", icon: Upload },
  { id: "notifications", title: "Notifications", icon: BellRing },
  { id: "devices", title: "Devices", icon: MonitorSmartphone },
  { id: "appearance", title: "Appearance", icon: Palette },
  { id: "activity", title: "Activity", icon: CheckCircle2 },
  { id: "support", title: "Support", icon: HelpCircle },
];

const SectionCard = ({ id, title, description, icon: Icon, children }: SectionCardProps) => (
  <Card id={id} className="glass-card scroll-mt-24 border-0">
    <CardHeader className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-1 text-sm leading-6">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const SettingRow = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <SettingRow title={title} description={description}>
    <Switch checked={checked} onCheckedChange={onChange} />
  </SettingRow>
);

export const SettingsCategorySidebar = ({
  activeSection,
  onSelect,
}: {
  activeSection: SettingSectionId;
  onSelect: (id: SettingSectionId) => void;
}) => (
  <aside className="lg:sticky lg:top-5 lg:self-start">
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
        <CardDescription>Jump to a category</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5 p-3 pt-0 sm:grid-cols-2 lg:grid-cols-1">
        {settingsNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
              activeSection === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-secondary/80",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  </aside>
);

export const AccountInformationSection = ({
  settings,
  profilePicture,
  createdAt,
  lastLogin,
  accountSaving,
  onSettingChange,
  onProfilePictureChange,
  onRemoveProfilePicture,
  onUpdateAccount,
  onChangePassword,
  onLogoutAllDevices,
  onDeleteAccount,
}: {
  settings: SettingsState;
  profilePicture?: string | null;
  createdAt: string;
  lastLogin: string;
  accountSaving: boolean;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  onProfilePictureChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveProfilePicture: () => void;
  onUpdateAccount: () => void;
  onChangePassword: () => void;
  onLogoutAllDevices: () => void;
  onDeleteAccount: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <SectionCard
      id="account"
      title="Account Information"
      description="Manage your identity, sign-in details, and account-level actions."
      icon={UserRound}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile name</Label>
            <Input
              id="profile-name"
              value={settings.profileName}
              onChange={(event) => onSettingChange("profileName", event.target.value)}
              onBlur={onUpdateAccount}
              className="bg-white/80 dark:bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-address">Email address</Label>
            <Input
              id="email-address"
              type="email"
              value={settings.email}
              onChange={(event) => onSettingChange("email", event.target.value)}
              onBlur={onUpdateAccount}
              className="bg-white/80 dark:bg-card"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Profile picture</Label>
            <div className="flex flex-col gap-3 rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {profilePicture ? (
                  <img src={profilePicture} alt="" className="h-full w-full object-cover" />
                ) : (
                  settings.profileName.slice(0, 2).toUpperCase() || "CV"
                )}
              </div>
              <div className="flex flex-1 flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onProfilePictureChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="bg-white/80" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button type="button" variant="ghost" onClick={onRemoveProfilePicture}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={onUpdateAccount} disabled={accountSaving}>
            Save account details
          </Button>
          <Button variant="outline" className="bg-white/80" onClick={onChangePassword} disabled={accountSaving}>
            <KeyRound className="mr-2 h-4 w-4" />
            Change password
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Created</p>
            <p className="mt-2 font-semibold text-foreground">{createdAt}</p>
            <Separator className="my-4" />
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last login</p>
            <p className="mt-2 font-semibold text-foreground">{lastLogin}</p>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start bg-white/80" onClick={onLogoutAllDevices}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout from all devices
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete account?</DialogTitle>
                  <DialogDescription>
                    This confirmation protects the destructive account action. In this module the action is mocked unless
                    you connect a backend delete endpoint.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={onDeleteAccount}>
                    Confirm delete account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export const StorageManagementSection = ({
  totalCapacity,
  usedStorage,
  remainingStorage,
  usagePercent,
  breakdown,
  onUpgrade,
}: {
  totalCapacity: string;
  usedStorage: string;
  remainingStorage: string;
  usagePercent: number;
  breakdown: StorageBreakdownItem[];
  onUpgrade: () => void;
}) => (
  <SectionCard
    id="storage"
    title="Storage Management"
    description="Track capacity, remaining space, and the file types using the most storage."
    icon={Database}
  >
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-xl border border-border/75 bg-white/70 p-5 dark:bg-card/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Storage usage</p>
            <p className="mt-1 text-sm text-muted-foreground">{usedStorage} of {totalCapacity}</p>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{usagePercent}% used</Badge>
        </div>
        <Progress value={usagePercent} className="mt-5 h-3" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Total" value={totalCapacity} />
          <Metric label="Used" value={usedStorage} />
          <Metric label="Remaining" value={remainingStorage} />
        </div>
        <Button className="mt-5 w-full" onClick={onUpgrade}>
          <Cloud className="mr-2 h-4 w-4" />
          Upgrade storage plan
        </Button>
      </div>
      <div className="space-y-3">
        {breakdown.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-foreground">{item.label}</span>
              <span className="text-muted-foreground">{item.percent}% - {formatBytes(item.bytes)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div className={cn("h-full rounded-full", item.tone)} style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </SectionCard>
);

export const SecurityPrivacySection = ({
  twoFactorEnabled,
  sessions,
  loginActivity,
  onToggleTwoFactor,
  onChangePassword,
  onLogoutOtherDevices,
}: {
  twoFactorEnabled: boolean;
  sessions: SessionInfo[];
  loginActivity: ActivityInfo[];
  onToggleTwoFactor: (checked: boolean) => void;
  onChangePassword: () => void;
  onLogoutOtherDevices: () => void;
}) => (
  <SectionCard
    id="security"
    title="Security and Privacy"
    description="Review sessions, strengthen sign-in, and track recent account access."
    icon={ShieldCheck}
  >
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-3">
        <ToggleRow
          title="Two-factor authentication"
          description="Require a second verification step when signing in."
          checked={twoFactorEnabled}
          onChange={onToggleTwoFactor}
        />
        <SettingRow title="Password" description="Update your sign-in password.">
          <Button variant="outline" className="bg-white/80" onClick={onChangePassword}>
            Change
          </Button>
        </SettingRow>
        <Button className="w-full" onClick={onLogoutOtherDevices}>
          Logout other devices
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Active sessions</p>
          <div className="grid gap-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-white/70 p-3 dark:bg-card/80">
                <div className="flex min-w-0 items-center gap-3">
                  <Laptop className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{session.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.location} - {session.lastActive}</p>
                  </div>
                </div>
                {session.current && <Badge variant="secondary">Current</Badge>}
              </div>
            ))}
          </div>
        </div>
        <ActivityMiniList title="Login activity history" activities={loginActivity} />
      </div>
    </div>
  </SectionCard>
);

export const SharingSettingsSection = ({
  settings,
  onSettingChange,
}: {
  settings: SettingsState;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) => (
  <SectionCard
    id="sharing"
    title="Sharing Settings"
    description="Set default link behavior and sharing permissions for new shared files."
    icon={Link2}
  >
    <div className="grid gap-4 lg:grid-cols-2">
      <SettingRow title="Default sharing permission" description="Applied when a new share link is created.">
        <SettingsSelect
          value={settings.defaultSharingPermission}
          onValueChange={(value) => onSettingChange("defaultSharingPermission", value)}
          options={[
            { value: "viewer", label: "Viewer" },
            { value: "commenter", label: "Commenter" },
            { value: "editor", label: "Editor" },
          ]}
        />
      </SettingRow>
      <SettingRow title="Link expiration default" description="Default expiry period for newly generated links.">
        <SettingsSelect
          value={settings.linkExpirationDefault}
          onValueChange={(value) => onSettingChange("linkExpirationDefault", value)}
          options={[
            { value: "never", label: "Never" },
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </SettingRow>
      <ToggleRow
        title="Public link sharing"
        description="Allow files to be shared with anyone who has the link."
        checked={settings.publicLinkSharing}
        onChange={(checked) => onSettingChange("publicLinkSharing", checked)}
      />
      <ToggleRow
        title="Password-protected sharing"
        description="Encourage password protection on sensitive shared links."
        checked={settings.passwordProtectedSharing}
        onChange={(checked) => onSettingChange("passwordProtectedSharing", checked)}
      />
    </div>
  </SectionCard>
);

export const UploadPreferencesSection = ({
  settings,
  onSettingChange,
}: {
  settings: SettingsState;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) => (
  <SectionCard
    id="uploads"
    title="Upload Preferences"
    description="Control sync behavior, conflict prompts, and cleanup automation."
    icon={Upload}
  >
    <div className="grid gap-4 lg:grid-cols-2">
      <ToggleRow
        title="Auto-sync"
        description="Automatically sync files from connected devices."
        checked={settings.autoSync}
        onChange={(checked) => onSettingChange("autoSync", checked)}
      />
      <ToggleRow
        title="Resume interrupted uploads"
        description="Continue uploads after a network interruption."
        checked={settings.resumeUploads}
        onChange={(checked) => onSettingChange("resumeUploads", checked)}
      />
      <ToggleRow
        title="File overwrite confirmation"
        description="Ask before replacing a file with the same name."
        checked={settings.overwriteConfirmation}
        onChange={(checked) => onSettingChange("overwriteConfirmation", checked)}
      />
      <SettingRow title="Default upload folder" description="Where browser uploads should land first.">
        <SettingsSelect
          value={settings.defaultUploadFolder}
          onValueChange={(value) => onSettingChange("defaultUploadFolder", value)}
          options={[
            { value: "my-files", label: "My Files" },
            { value: "documents", label: "Documents" },
            { value: "images", label: "Images" },
            { value: "shared", label: "Shared" },
          ]}
        />
      </SettingRow>
      <SettingRow title="Auto-delete trash" description="Permanently remove trashed files after this many days.">
        <Input
          type="number"
          min="1"
          max="365"
          value={settings.trashRetentionDays}
          onChange={(event) => onSettingChange("trashRetentionDays", event.target.value)}
          className="w-full bg-white/80 dark:bg-card sm:w-32"
        />
      </SettingRow>
    </div>
  </SectionCard>
);

export const NotificationSettingsSection = ({
  settings,
  onSettingChange,
}: {
  settings: SettingsState;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) => (
  <SectionCard
    id="notifications"
    title="Notification Settings"
    description="Choose which account and workspace events should reach you."
    icon={BellRing}
  >
    <div className="grid gap-4 lg:grid-cols-2">
      <ToggleRow title="File upload success alerts" checked={settings.uploadSuccessAlerts} onChange={(checked) => onSettingChange("uploadSuccessAlerts", checked)} />
      <ToggleRow title="File shared alerts" checked={settings.fileSharedAlerts} onChange={(checked) => onSettingChange("fileSharedAlerts", checked)} />
      <ToggleRow title="Storage almost full alert" checked={settings.storageAlmostFullAlert} onChange={(checked) => onSettingChange("storageAlmostFullAlert", checked)} />
      <ToggleRow title="Login alert notifications" checked={settings.loginAlerts} onChange={(checked) => onSettingChange("loginAlerts", checked)} />
      <ToggleRow title="Weekly activity summary email" checked={settings.weeklySummaryEmail} onChange={(checked) => onSettingChange("weeklySummaryEmail", checked)} />
    </div>
  </SectionCard>
);

export const ConnectedDevicesSection = ({
  devices,
  onRemoveDevice,
}: {
  devices: DeviceInfo[];
  onRemoveDevice: (id: string) => void;
}) => (
  <SectionCard
    id="devices"
    title="Connected Devices"
    description="See devices connected to this account and remove stale access."
    icon={MonitorSmartphone}
  >
    <div className="grid gap-3">
      {devices.map((device) => (
        <div key={device.id} className="flex flex-col gap-3 rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <MonitorSmartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{device.name}</p>
              <p className="text-sm text-muted-foreground">Last active {device.lastActive}</p>
            </div>
          </div>
          <Button variant="outline" className="bg-white/80" onClick={() => onRemoveDevice(device.id)}>
            Remove device
          </Button>
        </div>
      ))}
    </div>
  </SectionCard>
);

export const AppearanceSettingsSection = ({
  settings,
  onSettingChange,
}: {
  settings: SettingsState;
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) => (
  <SectionCard
    id="appearance"
    title="Appearance Settings"
    description="Adjust visual comfort across the cloud storage dashboard."
    icon={Palette}
  >
    <div className="grid gap-4 lg:grid-cols-2">
      <ToggleRow
        title="Dark mode"
        description={settings.darkMode ? "Dark interface is enabled." : "Light interface is enabled."}
        checked={settings.darkMode}
        onChange={(checked) => onSettingChange("darkMode", checked)}
      />
      <SettingRow title="Font size">
        <SettingsSelect
          value={settings.fontSize}
          onValueChange={(value) => onSettingChange("fontSize", value)}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
        />
      </SettingRow>
      <SettingRow title="Language">
        <SettingsSelect
          value={settings.language}
          onValueChange={(value) => onSettingChange("language", value)}
          options={[
            { value: "en", label: "English" },
            { value: "hi", label: "Hindi" },
            { value: "es", label: "Spanish" },
            { value: "fr", label: "French" },
          ]}
        />
      </SettingRow>
      <div className="flex items-center gap-3 rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80">
        <Moon className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Appearance choices auto-save locally for this browser.</p>
      </div>
    </div>
  </SectionCard>
);

export const ActivityHistorySection = ({ activities }: { activities: ActivityInfo[] }) => (
  <SectionCard
    id="activity"
    title="Activity History"
    description="A recent audit table for uploads, deletes, shares, and login attempts."
    icon={CheckCircle2}
  >
    <div className="grid gap-3 md:hidden">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{activity.action}</p>
              <p className="mt-1 break-words text-xs text-muted-foreground">{activity.detail}</p>
            </div>
            <Badge variant={activity.status === "Blocked" ? "destructive" : "secondary"}>
              {activity.status}
            </Badge>
          </div>
          <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
            <span>{activity.timestamp}</span>
            <span>{activity.device}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="mobile-scroll-table hidden rounded-xl border border-border/75 bg-white/70 dark:bg-card/80 md:block">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <p className="font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.detail}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">{activity.timestamp}</TableCell>
              <TableCell>{activity.device}</TableCell>
              <TableCell>
                <Badge variant={activity.status === "Blocked" ? "destructive" : "secondary"}>
                  {activity.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </SectionCard>
);

export const HelpSupportSection = ({ appVersion }: { appVersion: string }) => {
  const navigate = useNavigate();

  return (
    <SectionCard
      id="support"
      title="Help and Support"
      description="Get help, report problems, and check the current app build."
      icon={HelpCircle}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <Button onClick={() => navigate("/help")}>
            <Contact className="mr-2 h-4 w-4" />
            Contact support
          </Button>
          <Button variant="outline" className="bg-white/80" onClick={() => navigate("/help")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ
          </Button>
          <Button variant="outline" className="bg-white/80" onClick={() => navigate("/help")}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report issue
          </Button>
        </div>
        <div className="rounded-xl border border-border/75 bg-white/70 p-4 dark:bg-card/80">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">App version</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{appVersion}</p>
        </div>
      </div>
    </SectionCard>
  );
};

const SettingsSelect = ({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full bg-white/80 dark:bg-card sm:w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-background/85 p-3">
    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const ActivityMiniList = ({ title, activities }: { title: string; activities: ActivityInfo[] }) => (
  <div>
    <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
    <div className="grid gap-2">
      {activities.slice(0, 3).map((activity) => (
        <div key={activity.id} className="rounded-xl border border-border/75 bg-white/70 p-3 dark:bg-card/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{activity.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activity.timestamp} - {activity.device}</p>
            </div>
            <Badge variant={activity.status === "Blocked" ? "destructive" : "secondary"}>{activity.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  </div>
);
