import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Remote push was removed from Expo Go on Android in SDK 53 — importing
 * expo-notifications there throws at module scope and takes the whole app down.
 * Every access goes through the lazy require below so the app still boots in
 * Expo Go with push quietly disabled. Native builds are unaffected.
 */
export const pushSupported =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

/** The expo-notifications module, or null wherever push isn't available. */
export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (!pushSupported) {
    cached = null;
    return cached;
  }
  try {
    cached = require("expo-notifications") as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}
