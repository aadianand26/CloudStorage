import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Share2, FolderTree, Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: JSX.Element;
  color: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return { icon: <Upload className="h-4 w-4" />, color: 'bg-blue-500' };
      case 'share':
        return { icon: <Share2 className="h-4 w-4" />, color: 'bg-green-500' };
      case 'organize':
        return { icon: <FolderTree className="h-4 w-4" />, color: 'bg-orange-500' };
      default:
        return { icon: <Clock className="h-4 w-4" />, color: 'bg-purple-500' };
    }
  };

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedActivities: Activity[] = data.map((file) => {
        const { icon, color } = getActivityIcon('upload');
        const now = new Date();
        const created = new Date(file.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo = '';
        if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
          timeAgo = 'Just now';
        }

        return {
          id: file.id,
          type: 'upload',
          description: `You uploaded ${file.name}`,
          timestamp: timeAgo,
          icon,
          color
        };
      });

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('recent-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${activity.color} text-white flex-shrink-0`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
