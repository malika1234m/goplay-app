import { AppState, Platform } from "react-native";
import { QueryClient, focusManager } from "@tanstack/react-query";

// React Query only knows about browser focus. Tell it when the app returns to the
// foreground so stale screens refetch — e.g. a booking the other side just confirmed.
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => sub.remove();
  });
}

/**
 * The app's single QueryClient.
 *
 * Lives here rather than in the root layout so `logout()` can reach it —
 * signing out has to drop every cached response, otherwise the next person to
 * sign in on this device sees the previous owner's bookings and earnings render
 * from cache before the refetch lands.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        !(error instanceof Error && error.message.startsWith("Session expired")) &&
        count < 1,
      staleTime: 30_000,
    },
    mutations: { retry: false },
  },
});
