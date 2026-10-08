import { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useT } from "@/lib/i18n/I18nProvider";

interface Props {
  message: string;
  onRetry: () => void;
}

export default function MaintenanceScreen({ message, onRetry }: Props) {
  const { t } = useT();
  const gearSpin = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(gearSpin, { toValue: 1, duration: 6000, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = gearSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <LinearGradient colors={["#1e3464", "#152647", "#0a1628"]} style={s.bg}>
      <StatusBar style="light" />
      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        {/* Icon */}
        <View style={s.iconWrap}>
          <View style={s.iconRing}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="settings-outline" size={52} color="#16a34a" />
            </Animated.View>
          </View>
        </View>

        <Text style={s.title}>{t("Under Maintenance")}</Text>
        <Text style={s.sub}>{message}</Text>

        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="time-outline" size={16} color="#16a34a" />
            <Text style={s.infoText}>{t("We'll be back shortly")}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
            <Text style={s.infoText}>{t("Your data is safe")}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="notifications-outline" size={16} color="#16a34a" />
            <Text style={s.infoText}>{t("We'll notify you when ready")}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={18} color="#16a34a" />
          <Text style={s.retryText}>{t("Check Again")}</Text>
        </TouchableOpacity>

        <Text style={s.footer}>GoPlay · goplay.lk</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:        { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },

  iconWrap: { marginBottom: 28 },
  iconRing: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(22,163,74,0.12)",
    borderWidth: 2, borderColor: "rgba(22,163,74,0.3)",
    alignItems: "center", justifyContent: "center",
  },

  title: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 12 },
  sub:   { fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22, marginBottom: 32 },

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    width: "100%", gap: 12, marginBottom: 28,
  },
  infoRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28,
    borderWidth: 1.5, borderColor: "#16a34a",
    backgroundColor: "rgba(22,163,74,0.1)",
    marginBottom: 32,
  },
  retryText: { fontSize: 15, fontWeight: "700", color: "#16a34a" },

  footer: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
});
