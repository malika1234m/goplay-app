import { Stack } from "expo-router";
import { useColors } from "@/lib/theme";

export default function EarningsStack() {
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
      <Stack.Screen name="index"        options={{ title: "Earnings"     }} />
      <Stack.Screen name="payouts"      options={{ title: "Payouts"      }} />
      <Stack.Screen name="bank-details" options={{ title: "Bank Details" }} />
    </Stack>
  );
}
