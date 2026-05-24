import { Stack } from "expo-router";
import { useColors } from "@/lib/theme";

export default function GroundsStack() {
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
      <Stack.Screen name="index"             options={{ title: "My Grounds"    }} />
      <Stack.Screen name="[id]/index"        options={{ title: "Ground"        }} />
      <Stack.Screen name="[id]/edit"         options={{ title: "Edit Details"  }} />
      <Stack.Screen name="[id]/courts"       options={{ title: "Courts"        }} />
      <Stack.Screen name="[id]/availability" options={{ title: "Availability"  }} />
      <Stack.Screen name="[id]/blocked"      options={{ title: "Blocked Dates" }} />
      <Stack.Screen name="[id]/workers"      options={{ title: "Workers"       }} />
    </Stack>
  );
}
