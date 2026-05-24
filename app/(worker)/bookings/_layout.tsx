import { Stack } from "expo-router";
import { useColors } from "@/lib/theme";

export default function WorkerBookingsStack() {
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
      <Stack.Screen name="index" options={{ title: "Bookings" }} />
      <Stack.Screen name="[id]"  options={{ title: "Booking Detail" }} />
    </Stack>
  );
}
