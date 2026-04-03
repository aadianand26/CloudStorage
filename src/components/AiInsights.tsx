import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  FileText, 
  Image, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Cache AI insights to prevent excessive API calls
const aiInsightCache = new Map<string, { insight: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let AI_COOLDOWN_UNTIL = 0; // global cooldown after 429

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
}

export const AiInsights = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const lastFetchRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const generateInsights = async (files: FileData[]) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const documentCount = files.filter(f => f.type.includes('document') || f.type.includes('pdf')).length;
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    const videoCount = files.filter(f => f.type.startsWith('video/')).length;
    
    const recentFiles = files.filter(f => {
      const daysDiff = (Date.now() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    // Generate AI insights for the most recent file if available
    let aiInsight = "Welcome! Upload your first file to get started with AI-powered insights.";
    
    if (files.length > 0) {
      const latestFile = files[0];
      const cacheKey = `${latestFile.id}-${latestFile.name}`;
      
      // Check cache first
      const cached = aiInsightCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached AI insight');
        aiInsight = cached.insight;
      } else {
        // Only call AI if enough time has passed since last call (prevent rate limiting)
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch < 10000) { // Wait at least 10 seconds between AI calls
          console.log('Skipping AI call (too soon), using fallback');
          aiInsight = files.length > 10 
            ? `You have ${files.length} files. Keep your collection organized for easy access.`
            : `Upload more files to unlock personalized AI recommendations.`;
        } else if (Date.now() < AI_COOLDOWN_UNTIL) {
          console.log('AI in cooldown window, skipping call');
          aiInsight = 'Smart insights temporarily unavailable. Try again later.';
        } else {
          try {
            console.log('Calling AI analyze for:', latestFile.name);
            lastFetchRef.current = Date.now();
            
            const { data, error } = await supabase.functions.invoke('ai-analyze', {
              body: { 
                fileName: latestFile.name,
                fileType: latestFile.type,
                fileSize: latestFile.size,
                analysisType: 'insights'
              }
            });
            
            if (error) {
              console.error('AI analyze error:', error);
              throw error;
            }
            
            if (data?.analysis) {
              console.log('Using AI-generated insight');
              const firstLine = String(data.analysis)
                .replace(/\*\*/g, '')
                .replace(/^(\d+\.\s*|[-*•]\s*)/gm, '')
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)[0] || '';
              aiInsight = firstLine.length > 160 ? firstLine.slice(0, 157) + '...' : firstLine;
              
              // Cache the result
              aiInsightCache.set(cacheKey, { insight: aiInsight, timestamp: Date.now() });
            } else {
              // Provide intelligent fallback based on file analysis
              if (imageCount > 5) {
                aiInsight = `You have ${imageCount} images. Consider organizing them into folders for better management.`;
              } else if (documentCount > 5) {
                aiInsight = `You have ${documentCount} documents. Use AI tagging to make them easier to search.`;
              } else if (files.length > 20) {
                aiInsight = `Your storage is growing! Consider cleaning up old or duplicate files to optimize space.`;
              } else {
                aiInsight = `You have ${files.length} files totaling ${(totalSize / (1024 * 1024)).toFixed(1)} MB. Keep your files organized for easy access.`;
              }
            }
          } catch (error: any) {
            console.error('AI insight generation failed:', error);
            
            // Handle rate limit specifically
            if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
              AI_COOLDOWN_UNTIL = Date.now() + 60_000; // 1 minute cooldown
              aiInsight = `Smart insights temporarily unavailable. Try refreshing in a moment.`;
            } else {
              // Provide intelligent fallback
              aiInsight = files.length > 10 
                ? `Your collection is growing! Consider using AI-powered organization features.`
                : `Upload more files to unlock personalized AI recommendations.`;
            }
          }
        }
      }
    }

    return [
      {
        title: 'Storage Overview',
        description: files.length > 0 
          ? `${files.length} files • ${(totalSize / (1024 * 1024)).toFixed(1)} MB used`
          : 'No files yet',
        type: 'info',
        icon: <TrendingUp className="h-5 w-5" />,
        action: null
      },
      {
        title: 'Smart Insights',
        description: aiInsight,
        type: 'info',
        icon: <Brain className="h-5 w-5" />,
        action: null
      },
      {
        title: 'Activity',
        description: recentFiles > 0 
          ? `${recentFiles} files this week`
          : 'No recent activity',
        type: recentFiles > 0 ? 'success' : 'reminder',
        icon: recentFiles > 0 ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />,
        action: null
      }
    ];
  };

  const fetchFilesAndGenerateInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name, type, size, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setFiles(data || []);
      const generatedInsights = await generateInsights(data || []);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error fetching files for insights:', error);
      const fallbackInsights = await generateInsights([]);
      setInsights(fallbackInsights);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilesAndGenerateInsights();

    const channel = supabase
      .channel('ai-insights-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Debounce real-time updates to prevent excessive calls
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            fetchFilesAndGenerateInsights();
          }, 2000); // Wait 2 seconds after last update
        }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'suggestion': return 'text-blue-600 bg-blue-50';
      case 'reminder': return 'text-orange-600 bg-orange-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Analyzing your files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Recommendations</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col h-full">
                <div className={`p-3 rounded-lg ${getInsightColor(insight.type)} w-fit mb-3`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-2">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    {insight.description}
                  </p>
                </div>
                {insight.action && (
                  <Button 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => {
                      alert(`${insight.action} feature coming soon!`);
                    }}
                  >
                    {insight.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};