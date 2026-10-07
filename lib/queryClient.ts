import { QueryClient } from "@tanstack/react-query";

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
