import { useCallback, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type UserDevice = Tables<"user_devices">;
type LoginActivity = Tables<"login_activity">;

const DEVICE_KEY = "clever-vault-device-fingerprint";

const getDeviceFingerprint = () => {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(DEVICE_KEY, generated);
  return generated;
};

const getBrowserName = (userAgent: string) => {
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/")) return "Safari";
  return "Browser";
};

const getOsName = (userAgent: string) => {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS X")) return "macOS";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  if (userAgent.includes("Linux")) return "Linux";
  return "Unknown OS";
};

const getDeviceDetails = () => {
  const userAgent = navigator.userAgent;
  const browser = getBrowserName(userAgent);
  const os = getOsName(userAgent);
  const deviceName = `${os} - ${browser}`;

  return {
    browser,
    os,
    deviceName,
    userAgent,
  };
};

const getSessionRecordKey = (userId: string, lastSignInAt?: string | null) =>
  `clever-vault-login-recorded-${userId}-${lastSignInAt ?? "active-session"}`;

export const useDeviceActivity = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (!hasSupabaseConfig || !user) {
      setDevices([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false });

    if (error) {
      console.error("Error loading user devices:", error);
      setLoading(false);
      return;
    }

    setDevices(data ?? []);
    setLoading(false);
  }, [user]);

  const fetchLoginActivity = useCallback(async () => {
    if (!hasSupabaseConfig || !user) {
      setLoginActivity([]);
      return;
    }

    const { data, error } = await supabase
      .from("login_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error loading login activity:", error);
      return;
    }

    setLoginActivity(data ?? []);
  }, [user]);

  const registerCurrentDevice = useCallback(async () => {
    if (!hasSupabaseConfig || !user) return;

    const fingerprint = getDeviceFingerprint();
    const details = getDeviceDetails();
    const now = new Date().toISOString();

    setCurrentFingerprint(fingerprint);

    const { data, error } = await supabase
      .from("user_devices")
      .upsert(
        {
          user_id: user.id,
          device_fingerprint: fingerprint,
          device_name: details.deviceName,
          browser: details.browser,
          os: details.os,
          user_agent: details.userAgent,
          last_active_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,device_fingerprint" },
      )
      .select("*")
      .single();

    if (error) {
      console.error("Error registering current device:", error);
      return;
    }

    setCurrentDeviceId(data.id);

    const sessionRecordKey = getSessionRecordKey(user.id, user.last_sign_in_at);
    if (!window.sessionStorage.getItem(sessionRecordKey)) {
      const { error: activityError } = await supabase.from("login_activity").insert({
        user_id: user.id,
        device_id: data.id,
        event_type: "login",
        status: "successful",
        device_name: details.deviceName,
        browser: details.browser,
        os: details.os,
        user_agent: details.userAgent,
      });

      if (activityError) {
        console.error("Error recording login activity:", activityError);
      } else {
        window.sessionStorage.setItem(sessionRecordKey, "true");
      }
    }
  }, [user]);

  useEffect(() => {
    void registerCurrentDevice();
    void fetchDevices();
    void fetchLoginActivity();
  }, [fetchDevices, fetchLoginActivity, registerCurrentDevice]);

  useEffect(() => {
    if (!hasSupabaseConfig || !user?.id) return;

    const channel = supabase
      .channel(`device-activity-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_devices",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchDevices();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "login_activity",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchLoginActivity();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices, fetchLoginActivity, user?.id]);

  const removeDevice = useCallback(
    async (deviceId: string) => {
      if (!hasSupabaseConfig || !user) return;

      const { error } = await supabase
        .from("user_devices")
        .delete()
        .eq("id", deviceId)
        .eq("user_id", user.id);

      if (error) throw error;
      setDevices((current) => current.filter((device) => device.id !== deviceId));
    },
    [user],
  );

  const removeOtherDevices = useCallback(async () => {
    if (!hasSupabaseConfig || !user || !currentDeviceId) return;

    const { error } = await supabase
      .from("user_devices")
      .delete()
      .eq("user_id", user.id)
      .neq("id", currentDeviceId);

    if (error) throw error;
    setDevices((current) => current.filter((device) => device.id === currentDeviceId));
  }, [currentDeviceId, user]);

  return useMemo(
    () => ({
      devices,
      loginActivity,
      currentDeviceId,
      currentFingerprint,
      loading,
      removeDevice,
      removeOtherDevices,
      refetch: async () => {
        await Promise.all([fetchDevices(), fetchLoginActivity()]);
      },
    }),
    [
      currentDeviceId,
      currentFingerprint,
      devices,
      fetchDevices,
      fetchLoginActivity,
      loading,
      loginActivity,
      removeDevice,
      removeOtherDevices,
    ],
  );
};
