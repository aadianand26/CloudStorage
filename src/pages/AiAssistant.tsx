import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { supabase } from "@/integrations/supabase/client";
import { buildWorkspaceContext, formatBytes } from "@/lib/file-utils";
import {
  Bot,
  Brain,
  FolderSearch,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Sparkles,
  Wand2,
} from "lucide-react";

const baseSuggestionChips = [
  "Summarize my latest PDFs",
  "Find duplicates with the most storage impact",
  "Suggest a folder structure for invoices",
  "Show files I should archive this month",
];

const assistantModules = [
  {
    icon: Brain,
    title: "Insight Engine",
    description: "Generate short summaries and recommendations from the files you already have.",
    actionLabel: "Review recent files",
    actionPath: "/recent",
  },
  {
    icon: Wand2,
    title: "Smart Organization",
    description: "Turn messy uploads into categories, naming ideas, and filing actions.",
    actionLabel: "Open My Files",
    actionPath: "/documents",
  },
  {
    icon: MessageSquareText,
    title: "Natural Prompts",
    description: "Use plain English questions and let the assistant work from your workspace context.",
    actionLabel: "Try Smart Search",
    actionPath: "/smart-search",
  },
];

const workflowPresets = [
  {
    title: "Monthly Cleanup",
    description: "Surface stale files, duplicates, and oversized uploads from your live file list.",
    prompt: "Review my workspace and tell me which files look stale, duplicated, or worth archiving first.",
  },
  {
    title: "Instant Research Notes",
    description: "Use your recent PDFs and extracted content to build short notes quickly.",
    prompt: "Summarize the most recent document-heavy uploads and point out the main topics they cover.",
  },
  {
    title: "Share Prep",
    description: "Spot files that are already shared or ready to send to other people.",
    prompt: "Find the files that look ready to share with a team or client and explain why.",
  },
  {
    title: "Smart Filing",
    description: "Get folder and naming ideas from actual file names in your workspace.",
    prompt: "Suggest a clean folder structure and naming pattern based on my current files.",
  },
];

const AiAssistant = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(baseSuggestionChips);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeFiles, totalSize, totalSizeLabel, recentFiles, loading: filesLoading } = useWorkspaceFiles();

  const workspaceSummary = useMemo(() => {
    if (activeFiles.length === 0) {
      return "Upload files to unlock workspace-level help.";
    }

    return `${activeFiles.length} active files · ${totalSizeLabel} used · ${recentFiles.length} uploaded in the last 7 days`;
  }, [activeFiles.length, recentFiles.length, totalSizeLabel]);

  const promptContext = useMemo(() => buildWorkspaceContext(activeFiles), [activeFiles]);

  const runAssistant = async (nextPrompt?: string) => {
    const effectivePrompt = (nextPrompt ?? prompt).trim();

    if (!effectivePrompt) {
      toast({
        title: "Add a prompt first",
        description: "Ask the assistant what you want to learn about your workspace.",
      });
      return;
    }

    if (activeFiles.length === 0) {
      toast({
        title: "No files available",
        description: "Upload files first so the assistant has real workspace context to work with.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-analyze", {
        body: {
          analysisType: "assistant",
          prompt: effectivePrompt,
          workspaceContext: promptContext,
          fileName: "Workspace Assistant",
          fileType: "workspace/context",
          fileSize: totalSize,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error?.message || "AI function invocation failed");
      }

      if (!data) {
        throw new Error("No response received from AI function");
      }

      const analysis = String(data?.analysis || "").trim();
      setPrompt(effectivePrompt);
      setResponse(analysis || "No response was returned for this workspace prompt.");
    } catch (error) {
      console.error("Assistant request failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a configuration error
      if (errorMessage.includes("AI_GATEWAY") || errorMessage.includes("not configured")) {
        toast({
          title: "AI Gateway not configured",
          description: "Please add AI_GATEWAY_API_KEY and AI_GATEWAY_URL to your Supabase edge function secrets.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        toast({
          title: "Rate limit exceeded",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assistant unavailable",
          description: errorMessage || "The AI request failed. Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMoreIdeas = () => {
    const dynamicSuggestions = [
      activeFiles.length > 0
        ? `How should I organize my ${activeFiles.length} current files?`
        : "What should I upload first to start organizing this workspace?",
      recentFiles.length > 0
        ? `What stands out in the ${recentFiles.length} files uploaded recently?`
        : "How can I prepare this workspace for future uploads?",
      totalSize > 0
        ? `How can I make better use of my ${formatBytes(totalSize)} of stored files?`
        : "What is the best starter structure for this workspace?",
      "Which files look most important based on their names and activity?",
    ];

    setSuggestions(dynamicSuggestions);
    toast({
      title: "Fresh ideas ready",
      description: "The assistant suggestions now reflect your current workspace.",
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <Card className="glass-card overflow-hidden border-0">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">AI Workspace</Badge>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">AI Assistant</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                        Turn your storage into a guided workspace. Ask for summaries, cleanup ideas,
                        search help, or smarter organization plans built from your actual files.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((chip) => (
                        <Button
                          key={chip}
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-white/70"
                          onClick={() => setPrompt(chip)}
                        >
                          {chip}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/80 bg-white/80 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Ask Clever Vault</p>
                        <p className="text-xs text-muted-foreground">
                          {filesLoading ? "Loading workspace context..." : workspaceSummary}
                        </p>
                      </div>
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Example: Find files uploaded this month that probably belong in shared folders, then summarize the top three."
                      className="min-h-[140px] resize-none bg-background/80"
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Suggested outputs: summary, cleanup plan, tags, folders
                      </p>
                      <Button onClick={() => void runAssistant()} disabled={loading || filesLoading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Run Prompt
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {assistantModules.map((module) => (
                <Card key={module.title} className="glass-card border-0">
                  <CardContent className="p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <module.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{module.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full bg-white/70"
                      onClick={() => navigate(module.actionPath)}
                    >
                      {module.actionLabel}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {response && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Assistant Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{response}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Suggested Workflows</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {workflowPresets.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      className="rounded-2xl border border-border/80 bg-white/70 p-4 text-left transition-colors hover:border-primary/30"
                      onClick={() => {
                        setPrompt(item.prompt);
                        void runAssistant(item.prompt);
                      }}
                    >
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Ready Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className="w-full rounded-2xl border border-border/80 bg-white/75 p-3 text-left transition-colors hover:border-primary/30"
                      onClick={() => {
                        setPrompt(command);
                        void runAssistant(command);
                      }}
                    >
                      <p className="text-sm text-foreground">{command}</p>
                    </button>
                  ))}
                  <Button variant="outline" className="w-full bg-white/70" onClick={generateMoreIdeas}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate More Ideas
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => navigate("/smart-search")}>
                    <FolderSearch className="mr-2 h-4 w-4" />
                    Open Smart Search
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

export default AiAssistant;
