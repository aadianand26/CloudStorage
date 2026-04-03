import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

type WorkspaceProfile = Tables<"profiles">;
type WorkspaceProfileUpdate = TablesUpdate<"profiles">;

const getDefaultProfile = (userId: string, email?: string | null): WorkspaceProfile => ({
  id: userId,
  user_id: userId,
  avatar_url: null,
  compact_dashboard: false,
  created_at: new Date(0).toISOString(),
  display_name: email ?? "Workspace User",
  plan: "Pro",
  protected_share_links: true,
  role: "Owner",
  suspicious_activity_alerts: true,
  sync_window_minutes: 15,
  two_factor_enabled: true,
  updated_at: new Date(0).toISOString(),
  upload_suggestions: true,
  weekly_digest: true,
  wifi_only_uploads: true,
  workspace_name: "Clever Vault",
});

export const useWorkspaceProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        return;
      }

      const fallback = getDefaultProfile(user.id, user.email);
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            display_name: user.user_metadata?.display_name ?? user.email,
            workspace_name: "Clever Vault",
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        setProfile(fallback);
        return;
      }

      setProfile(inserted);
    } catch (error) {
      console.error("Error loading workspace profile:", error);
      setProfile(getDefaultProfile(user.id, user.email));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();

    if (!user?.id) return;

    const channel = supabase
      .channel(`workspace-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as WorkspaceProfile);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile, user]);

  const updateProfile = useCallback(
    async (updates: WorkspaceProfileUpdate) => {
      if (!user) throw new Error("No user session found");

      setSaving(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (error) throw error;

        setProfile(data);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const safeProfile = useMemo(() => {
    if (profile) return profile;
    if (!user) return null;
    return getDefaultProfile(user.id, user.email);
  }, [profile, user]);

  return {
    profile: safeProfile,
    loading,
    saving,
    refetch: fetchProfile,
    updateProfile,
  };
};
