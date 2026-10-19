import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@/lib/api";
import { getNotifications } from "@/lib/notifications";

let handlerSet   = false;
let tokenWatched = false;

/** Install the foreground presentation handler once, if push is available. */
function ensureHandler(): void {
  if (handlerSet) return;
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:   true,
      shouldPlaySound:   true,
      shouldSetBadge:    true,
      shouldShowBanner:  true,
      shouldShowList:    true,
    }),
  });
  handlerSet = true;
}

/**
 * Ask for permission, fetch this device's Expo push token and save it to the account.
 * Safe to call on every launch and login. Android needs FCM (google-services.json in the
 * build) for a token — without it this logs why instead of failing silently.
 */
export async function registerPushToken(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  ensureHandler();

  // Android 13+ only shows the permission prompt once a channel exists
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name:       "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (err) {
    // Usually missing FCM setup on Android — see google-services.json in app.config.js
    console.warn("[push] Could not get a push token:", err instanceof Error ? err.message : err);
    return;
  }

  await api.post("/api/push-token", { token }).catch((err) => {
    console.warn("[push] Could not save the push token:", err instanceof Error ? err.message : err);
  });

  // FCM can rotate the device token; save the new Expo token when it does
  if (!tokenWatched) {
    tokenWatched = true;
    Notifications.addPushTokenListener(() => { void registerPushToken(); });
  }
}

export async function clearPushToken(): Promise<void> {
  await api.delete("/api/push-token").catch(() => {});
}
