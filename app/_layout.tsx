import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
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

  const notifListener    = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Handle notification taps
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link as string | undefined;
      if (link) router.push(link as any);
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)"     />
        <Stack.Screen name="(owner)"    />
        <Stack.Screen name="(worker)"   />
        <Stack.Screen name="+not-found" />
      </Stack>
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
