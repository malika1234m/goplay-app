import { Stack } from "expo-router";
import { useColors } from "@/lib/theme";
import { useT } from "@/lib/i18n/I18nProvider";

export default function WorkerBookingsStack() {
  const { t } = useT();
  const Colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle:         { backgroundColor: Colors.card },
        headerTintColor:     Colors.primary,
        headerTitleStyle:    { fontWeight: "700", fontSize: 17 },
        headerShadowVisible: false,
        headerBackTitle:     "Back",
      }}
    >
      <Stack.Screen name="index" options={{ title: t("Bookings") }} />
      <Stack.Screen name="[id]"  options={{ title: t("Booking Detail") }} />
      <Stack.Screen name="payments" options={{ title: t("Needs action") }} />
    </Stack>
  );
}
