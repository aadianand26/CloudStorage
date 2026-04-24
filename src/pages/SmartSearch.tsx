import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileViewer } from "@/components/FileViewer";
import { ShareDialog } from "@/components/ShareDialog";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, getFileKindLabel } from "@/lib/file-utils";
import {
  Compass,
  Eye,
  FileSearch,
  Filter,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";

const searchPatterns = [
  "invoice",
  "shared",
  "pdf",
  "recent",
];

type SearchMode = "semantic" | "recent" | "shared" | "content";

const searchModes: Array<{
  id: SearchMode;
  title: string;
  description: string;
}> = [
  { id: "semantic", title: "Semantic", description: "Search by name, type, and general workspace intent." },
  { id: "recent", title: "Recent", description: "Prioritize files that were uploaded or viewed lately." },
  { id: "shared", title: "Shared", description: "Show collaboration-ready files first." },
  { id: "content", title: "Content", description: "Search inside extracted PDF and image text." },
];

const SmartSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [shareFile, setShareFile] = useState<any | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { activeFiles, loading, sharedFiles, recentFiles } = useWorkspaceFiles();

  const downloadFile = async (file: any) => {
    try {
      const { data, error } = await supabase.storage.from("user-files").download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${file.name} is downloading.`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "Could not download this file.",
        variant: "destructive",
      });
    }
  };

  const rankedResults = useMemo(() => {
    const base = activeFiles.map((file) => {
      let score = 0;
      const haystack = `${file.name} ${file.type} ${file.content ?? ""}`.toLowerCase();

      if (!deferredQuery) {
        score += 1;
      } else {
        if (file.name.toLowerCase().includes(deferredQuery)) score += 6;
        if (file.type.toLowerCase().includes(deferredQuery)) score += 4;
        if ((file.content ?? "").toLowerCase().includes(deferredQuery)) score += 8;
        if (deferredQuery === "shared" && file.is_shared) score += 10;
        if (deferredQuery === "recent") {
          const lastAccess = new Date(file.last_accessed_at).getTime();
          const ageHours = (Date.now() - lastAccess) / (1000 * 60 * 60);
          if (ageHours <= 72) score += 7;
        }
      }

      if (mode === "shared" && file.is_shared) score += 8;
      if (mode === "recent") {
        const ageHours = (Date.now() - new Date(file.last_accessed_at).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 168) score += 8;
      }
      if (mode === "content" && file.content) score += 5;
      if (mode === "semantic" && haystack.includes("invoice") && deferredQuery.includes("invoice")) score += 4;

      return { file, score };
    });

    return base
      .filter(({ file, score }) => {
        if (!deferredQuery) {
          return mode === "shared" ? file.is_shared : true;
        }

        if (mode === "content") {
          return score > 0 && !!file.content;
        }

        if (mode === "shared") {
          return score > 0 && file.is_shared;
        }

        return score > 0;
      })
      .sort((left, right) => right.score - left.score || new Date(right.file.created_at).getTime() - new Date(left.file.created_at).getTime());
  }, [activeFiles, deferredQuery, mode]);

  const resultSummary = useMemo(() => {
    if (mode === "shared") {
      return `${sharedFiles.length} shared files currently available`;
    }
    if (mode === "recent") {
      return `${recentFiles.length} files touched in the last 7 days`;
    }
    return `${activeFiles.length} files indexed for search`;
  }, [activeFiles.length, mode, recentFiles.length, sharedFiles.length]);

  const topResults = rankedResults.slice(0, 6);

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <FileViewer
          file={viewerFile}
          open={!!viewerFile}
          onClose={() => setViewerFile(null)}
          onDownload={() => {
            if (viewerFile) {
              void downloadFile(viewerFile);
            }
          }}
          onShare={() => {
            setShareFile(viewerFile);
            setViewerFile(null);
          }}
        />

        <ShareDialog file={shareFile} open={!!shareFile} onClose={() => setShareFile(null)} />

        <section className="page-shell">
          <div className="page-container">
            <Card className="glass-card border-0">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Search Intelligence</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Smart Search</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Search across titles, metadata, extracted text, and recent file activity with live
                        results from your existing Supabase workspace.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border/80 bg-white/80 p-4 shadow-sm">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search by intent, type, date, or content"
                          className="h-12 rounded-2xl bg-background pl-11 text-sm"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {searchPatterns.map((pattern) => (
                          <Button
                            key={pattern}
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-white/70"
                            onClick={() => setQuery(pattern)}
                          >
                            {pattern}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Compass className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Search Modes</p>
                        <p className="text-xs text-muted-foreground">{resultSummary}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {searchModes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMode(item.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                            mode === item.id
                              ? "border-primary bg-primary/10"
                              : "border-border/80 bg-background/70 hover:border-primary/30"
                          }`}
                        >
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="glass-card border-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-primary" />
                    Live Search Results
                  </CardTitle>
                  <Badge variant="secondary" className="bg-accent text-foreground">
                    {rankedResults.length} matches
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-border/80 bg-white/75 p-6 text-sm text-muted-foreground">
                      Indexing your files...
                    </div>
                  ) : topResults.length === 0 ? (
                    <div className="rounded-2xl border border-border/80 bg-white/75 p-6 text-sm text-muted-foreground">
                      No files matched this search yet. Try a broader keyword or switch the mode.
                    </div>
                  ) : (
                    topResults.map(({ file, score }) => (
                      <div key={file.id} className="rounded-2xl border border-border/80 bg-white/75 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getFileKindLabel(file.type)} - {formatBytes(file.size)} - Uploaded{" "}
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                            <p className="mt-3 text-sm text-muted-foreground">
                              Match score {score}
                              {file.is_shared ? " · shared file" : ""}
                              {file.content ? " · searchable content available" : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => setViewerFile(file)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShareFile(file)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Search Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {[
                    `Current mode: ${searchModes.find((item) => item.id === mode)?.title}`,
                    deferredQuery ? `Searching for "${deferredQuery}" across indexed file data.` : "Start typing to narrow live workspace results.",
                    `${sharedFiles.length} files are shared and ${recentFiles.length} files were active recently.`,
                    "Open a result to update its recent-access activity automatically.",
                  ].map((tip) => (
                    <div key={tip} className="rounded-2xl border border-border/80 bg-white/75 p-4">
                      <div className="flex gap-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="bg-white/70" onClick={() => navigate("/documents")}>
                    Open My Files
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SmartSearch;
