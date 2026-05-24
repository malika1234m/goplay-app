import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useColors } from "@/lib/theme";

export default function NotFound() {
  const Colors = useColors();

  const s = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    iconBox:   { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    code:      { fontSize: 72, fontWeight: "900", color: "rgba(255,255,255,0.15)", lineHeight: 72, marginBottom: 8 },
    title:     { fontSize: 24, fontWeight: "800", color: Colors.white, marginBottom: 10 },
    sub:       { fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 22, marginBottom: 36 },
    btn:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
    btnText:   { fontSize: 16, fontWeight: "700", color: Colors.navy },
  });

  return (
    <LinearGradient
      colors={[Colors.navy, Colors.navyDark, "#0a1628"]}
      style={s.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={s.iconBox}>
        <Ionicons name="compass-outline" size={56} color="rgba(255,255,255,0.6)" />
      </View>

      <Text style={s.code}>404</Text>
      <Text style={s.title}>Screen not found</Text>
      <Text style={s.sub}>The page you're looking for doesn't exist or has been moved.</Text>

      <Link href="/" asChild>
        <TouchableOpacity style={s.btn} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color={Colors.navy} />
          <Text style={s.btnText}>Go Home</Text>
        </TouchableOpacity>
      </Link>
    </LinearGradient>
  );
}
