import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Sparkles, 
  Filter,
  Calendar,
  FileType,
  Tag
} from "lucide-react";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiMode, setIsAiMode] = useState(false);

  const suggestedSearches = [
    { label: "Recent documents", icon: Calendar },
    { label: "Images from vacation", icon: FileType },
    { label: "Work presentations", icon: Tag },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        <div className="flex items-center glass-card p-2 gap-2">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <Input
            placeholder={isAiMode ? "Ask AI: 'Find all my vacation photos' or 'Show documents from last month'" : "Search files, folders, and content..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent text-lg flex-1 focus-visible:ring-0"
          />
          <Button
            variant={isAiMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAiMode(!isAiMode)}
            className={isAiMode ? "bg-ai-gradient hover:opacity-90" : ""}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Search
          </Button>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {suggestedSearches.map((suggestion, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-accent/30 transition-colors bg-accent/10 border-accent/20"
            onClick={() => setSearchQuery(suggestion.label)}
          >
            <suggestion.icon className="w-3 h-3 mr-1" />
            {suggestion.label}
          </Badge>
        ))}
      </div>

      {isAiMode && (
        <div className="mt-4 p-4 glass-card bg-ai-gradient-subtle border border-primary/20">
          <div className="flex items-center mb-2">
            <Sparkles className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium">AI-Powered Search</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Use natural language to find files. Try "Show me all PDFs from this month" or "Find images with people in them"
          </p>
        </div>
      )}
    </div>
  );
};