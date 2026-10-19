import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useColors } from "@/lib/theme";
import { useT } from "@/lib/i18n/I18nProvider";

export default function GroundsStack() {
  const { t } = useT();
  const Colors = useColors();
  const router = useRouter();

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
      {/* Opened from Home or Profile, so it's often the stack's only screen — back goes to where you came from */}
      <Stack.Screen name="setup"             options={{ title: t("Setup guide"), headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityLabel={t("Back")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ) }} />
    </Stack>
  );
}
