import { Stack } from "expo-router";
import { useColors } from "@/lib/theme";
import { useT } from "@/lib/i18n/I18nProvider";

export default function GroundsStack() {
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
      <Stack.Screen name="index"             options={{ title: t("My Grounds")    }} />
      <Stack.Screen name="new"               options={{ headerShown: false     }} />
      <Stack.Screen name="[id]/index"        options={{ title: t("Ground")        }} />
      <Stack.Screen name="[id]/edit"         options={{ title: t("Edit Details")  }} />
      <Stack.Screen name="[id]/courts"       options={{ title: t("Courts")        }} />
      <Stack.Screen name="[id]/availability" options={{ title: t("Availability")  }} />
      <Stack.Screen name="[id]/blocked"      options={{ title: t("Blocked Dates") }} />
      <Stack.Screen name="[id]/workers"      options={{ title: t("Workers")       }} />
      <Stack.Screen name="[id]/payment"      options={{ title: t("Payment Details") }} />
    </Stack>
  );
}
