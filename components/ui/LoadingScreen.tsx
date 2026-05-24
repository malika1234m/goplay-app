import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useColors } from "@/lib/theme";

export default function LoadingScreen() {
  const Colors = useColors();

  const s = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  });

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
