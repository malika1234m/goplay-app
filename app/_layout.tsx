import { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import * as SecureStore from "expo-secure-store";
import { getNotifications } from "@/lib/notifications";
import * as Application from "expo-application";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider, useT } from "@/lib/i18n/I18nProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import MaintenanceScreen from "@/components/ui/MaintenanceScreen";
import ForceUpdateScreen from "@/components/ui/ForceUpdateScreen";
import OTAUpdateBanner from "@/components/ui/OTAUpdateBanner";
import { BASE_URL } from "@/lib/api";
import { ONBOARDING_KEY } from "@/app/onboarding";

/** Notifications carry website paths (e.g. /ground-owner/bookings); open the matching app screen instead. */
function mapWebLink(link: string, role?: string): string {
  if (role === "GROUND_WORKER") return link.includes("/bookings") ? "/(worker)/bookings" : "/(worker)";
  if (link.startsWith("/ground-owner/bookings")) return "/(owner)/bookings";
  if (link.startsWith("/ground-owner/earnings")) return "/(owner)/earnings";
  return "/(owner)/notifications";
}

// Compare semver strings — returns true if current < min
function isOutdated(current: string, min: string): boolean {
  const parse = (v: string) => v.replace(/[^0-9.]/g, "").split(".").map(Number);
  const [cMaj, cMin, cPat] = parse(current);
  const [mMaj, mMin, mPat] = parse(min);
  if (cMaj !== mMaj) return cMaj < mMaj;
  if (cMin !== mMin) return cMin < mMin;
  return cPat < mPat;
}

interface AppConfig {
  maintenance:        boolean;
  maintenanceMessage: string;
  minAppVersion:      string;
}

function AuthGuard() {
  const { user, isLoading, pendingApp } = useAuth();
  const { ready: langReady } = useT();
  const segments = useSegments();
  const router   = useRouter();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [appConfig,   setAppConfig]   = useState<AppConfig | null>(null);
  const [configReady, setConfigReady] = useState(false);

  const notifListener    = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  // Handle notification taps. No-ops where push is unavailable (Expo Go) — see lib/notifications
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link as string | undefined;
      if (link) router.push(mapWebLink(link, user?.role) as any);
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router, user?.role]);

  const fetchAppConfig = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/app-config`);
      const json: AppConfig = await res.json();
      setAppConfig(json);
    } catch {
      // Fail open — never block users due to network error
      setAppConfig({ maintenance: false, maintenanceMessage: "", minAppVersion: "1.0.0" });
    } finally {
      setConfigReady(true);
    }
  }, []);

  useEffect(() => { fetchAppConfig(); }, [fetchAppConfig]);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setHasSeenOnboarding(!!val);
      setOnboardingChecked(true);
    });
  }, [segments]);

  useEffect(() => {
    if (isLoading || !onboardingChecked || !configReady) return;

    const inAuth       = segments[0] === "(auth)";
    const inOwner      = segments[0] === "(owner)";
    const inWorker     = segments[0] === "(worker)";

    if (user) {
      if (user.role === "GROUND_OWNER" && !inOwner)  router.replace("/(owner)");
      else if (user.role === "GROUND_WORKER" && !inWorker) router.replace("/(worker)");
      return;
    }

    if (pendingApp) {
      const inAppStatus = (segments as string[]).includes("application-status");
      if (!inAppStatus) router.replace("/(auth)/application-status");
      return;
    }

    if (!hasSeenOnboarding && segments[0] !== "onboarding" && !inAuth) {
      router.replace("/onboarding");
    } else if (hasSeenOnboarding && !inAuth) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, segments, onboardingChecked, hasSeenOnboarding, pendingApp, configReady]);

  // Show loading while auth + config resolve
  if (isLoading || !configReady || !onboardingChecked || !langReady) {
    return <LoadingScreen />;
  }

  // Maintenance mode
  if (appConfig?.maintenance) {
    return (
      <MaintenanceScreen
        message={appConfig.maintenanceMessage}
        onRetry={fetchAppConfig}
      />
    );
  }

  // Force update
  const currentVersion = Application.nativeApplicationVersion ?? "1.0.0";
  if (appConfig && isOutdated(currentVersion, appConfig.minAppVersion)) {
    return (
      <ForceUpdateScreen
        currentVersion={currentVersion}
        minVersion={appConfig.minAppVersion}
      />
    );
  }

  // "/" resolves to (owner)/index, so the dashboard mounts before the redirect above runs.
  // Keep the navigator mounted (the redirect needs it) but cover it until the route matches.
  const group = segments[0] as string | undefined;
  const home  = user?.role === "GROUND_OWNER" ? "(owner)" : user?.role === "GROUND_WORKER" ? "(worker)" : null;
  const settled = group === "+not-found"
    || (user ? (home === null || group === home) : group === "(auth)" || group === "onboarding");

  return (
    <>
      {/* Root changes are auth redirects — animating one slides the screen being left (often a
          dashboard mounted only because "/" resolves to it) across the screen for a moment */}
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)"     />
        <Stack.Screen name="(owner)"    />
        <Stack.Screen name="(worker)"   />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!settled && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
        </View>
      )}
      <OTAUpdateBanner />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <I18nProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <AuthGuard />
              </AuthProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
