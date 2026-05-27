import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ONBOARDING_KEY } from "@/app/onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        !(error instanceof Error && error.message.startsWith("Session expired")) &&
        count < 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

function AuthGuard() {
  const { user, isLoading, pendingApp } = useAuth();
  const segments = useSegments();
  const router   = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
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

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setHasSeenOnboarding(!!val);
      setOnboardingChecked(true);
    });
  }, [segments]);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;

    const inAuth       = segments[0] === "(auth)";
    const inOwner      = segments[0] === "(owner)";
    const inWorker     = segments[0] === "(worker)";
    const inOnboarding = segments[0] === "onboarding";

    if (user) {
      if (user.role === "GROUND_OWNER" && !inOwner) {
        router.replace("/(owner)");
      } else if (user.role === "GROUND_WORKER" && !inWorker) {
        router.replace("/(worker)");
      }
      return;
    }

    // Not logged in — pendingApp comes from AuthContext (updates synchronously)
    if (pendingApp) {
      const inAppStatus = (segments as string[]).includes("application-status");
      if (!inAppStatus) router.replace("/(auth)/application-status");
      return;
    }

    if (!hasSeenOnboarding && !inOnboarding && !inAuth) {
      router.replace("/onboarding");
    } else if (hasSeenOnboarding && !inAuth) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, segments, onboardingChecked, hasSeenOnboarding, pendingApp]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)"     />
      <Stack.Screen name="(owner)"    />
      <Stack.Screen name="(worker)"   />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AuthGuard />
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
