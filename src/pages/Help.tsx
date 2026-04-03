import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { ArrowUpRight, BookOpenText, HelpCircle, LifeBuoy, MessageSquare, Search } from "lucide-react";

const Help = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { activeFiles, sharedFiles, recentFiles } = useWorkspaceFiles();
  const { profile } = useWorkspaceProfile();

  const helpTopics = useMemo(
    () =>
      [
        ["How do I organize files faster?", "Use tags, folder suggestions, and AI prompts to group similar uploads."],
        ["Why is a sync taking longer?", "Large folders, slower networks, or Wi-Fi-only uploads can delay completion."],
        ["How do I protect shared files?", "Enable expiring links and review access controls from the Security Center."],
        ["Can I search inside PDFs?", "Yes, Smart Search can use extracted content from supported files."],
        [`How many files are in this workspace?`, `Your workspace currently has ${activeFiles.length} active files.`],
        [`How many files are shared right now?`, `${sharedFiles.length} files are currently shared from this account.`],
      ].filter(([title, description]) => {
        const text = `${title} ${description}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      }),
    [activeFiles.length, query, sharedFiles.length],
  );

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="px-3 pb-8 pt-4 md:px-6 md:pb-12 md:pt-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <Card className="glass-card overflow-hidden border-0">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Help & Support</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Help Center</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Search help topics, jump to the right part of the product, and use live workspace
                        counts to guide support recommendations.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border/80 bg-white/80 p-4 shadow-sm">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search help articles, support topics, or troubleshooting steps"
                          className="h-12 rounded-2xl bg-background pl-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Support Snapshot</p>
                        <p className="text-xs text-muted-foreground">Context from your active workspace</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {profile?.workspace_name ?? "Clever Vault"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Files</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{activeFiles.length}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shared</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{sharedFiles.length}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{recentFiles.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Support Channels</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: MessageSquare,
                      title: "Chat-style help",
                      description: "Jump into AI Assistant for guided organization and file help.",
                      action: () => navigate("/ai-assistant"),
                      label: "Open AI Assistant",
                    },
                    {
                      icon: BookOpenText,
                      title: "Knowledge paths",
                      description: "Go to Smart Search, Security, or Sync depending on the issue.",
                      action: () => navigate("/smart-search"),
                      label: "Open Smart Search",
                    },
                    {
                      icon: LifeBuoy,
                      title: "Support routing",
                      description: "Use dedicated product areas for sharing, uploads, and workspace settings.",
                      action: () => navigate("/settings"),
                      label: "Open Settings",
                    },
                  ].map((channel) => (
                    <div key={channel.title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <channel.icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">{channel.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{channel.description}</p>
                      <Button variant="outline" className="mt-4 w-full bg-white/70" onClick={channel.action}>
                        {channel.label}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Quick Actions</CardTitle>
                  <Button variant="outline" className="w-full bg-white/70 sm:w-auto" onClick={() => setQuery("")}>
                    View All Guides
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Open getting-started checklist", () => navigate("/documents")],
                    ["Review sharing best practices", () => navigate("/shared")],
                    ["Troubleshoot upload issues", () => navigate("/sync")],
                    ["Review security defaults", () => navigate("/security")],
                  ].map(([label, action]) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-start rounded-2xl bg-white/75 px-4 py-3 text-left"
                      onClick={action as () => void}
                    >
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Popular Help Topics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {helpTopics.length === 0 ? (
                  <div className="rounded-3xl border border-border/80 bg-white/75 p-4 text-sm text-muted-foreground">
                    No help topics matched this search. Try a broader phrase like "share", "sync", or "PDF".
                  </div>
                ) : (
                  helpTopics.map(([title, description]) => (
                    <div key={title} className="rounded-3xl border border-border/80 bg-white/75 p-4">
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Help;
