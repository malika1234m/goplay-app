import { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useT } from "@/lib/i18n/I18nProvider";

const PLAY_STORE_URL  = "https://play.google.com/store/apps/details?id=com.goplay.app";
const APP_STORE_URL   = "https://apps.apple.com/app/goplay/id0000000000"; // update with real ID

interface Props {
  currentVersion: string;
  minVersion:     string;
}

export default function ForceUpdateScreen({ currentVersion, minVersion }: Props) {
  const { t } = useT();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  function openStore() {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url);
  }

  return (
    <LinearGradient colors={["#1e3464", "#152647", "#0a1628"]} style={s.bg}>
      <StatusBar style="light" />
      <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Icon */}
        <View style={s.iconRing}>
          <Ionicons name="arrow-up-circle" size={56} color="#16a34a" />
        </View>

        <Text style={s.title}>{t("Update Required")}</Text>
        <Text style={s.sub}>
          {t("A newer version of GoPlay is available. Please update to continue using the app.")}
        </Text>

        <View style={s.versionCard}>
          <View style={s.versionRow}>
            <Text style={s.versionLabel}>{t("Your version")}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>{currentVersion}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.versionRow}>
            <Text style={s.versionLabel}>{t("Required version")}</Text>
            <View style={[s.badge, s.badgeGreen]}>
              <Text style={[s.badgeText, { color: "#fff" }]}>{minVersion}</Text>
            </View>
          </View>
        </View>

        <View style={s.featureList}>
          <Text style={s.featureTitle}>{t("What's new in this update")}</Text>
          {[t("Bug fixes and performance improvements"), t("New features and UI improvements"), t("Security patches")].map((f) => (
            <View key={f} style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.updateBtn} onPress={openStore} activeOpacity={0.88}>
          <LinearGradient
            colors={["#16a34a", "#15803d"]}
            style={s.updateGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons name={Platform.OS === "ios" ? "logo-apple" : "logo-google-playstore"} size={20} color="#fff" />
            <Text style={s.updateText}>
              {Platform.OS === "ios" ? t("Update on App Store") : t("Update on Play Store")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.footer}>GoPlay · goplay.lk</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:        { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },

  iconRing: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(22,163,74,0.12)",
    borderWidth: 2, borderColor: "rgba(22,163,74,0.3)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },

  title: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 },
  sub:   { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22, marginBottom: 24 },

  versionCard: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    width: "100%", marginBottom: 20,
  },
  versionRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  versionLabel:{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: "500" },
  divider:     { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },
  badge:       { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeGreen:  { backgroundColor: "#16a34a" },
  badgeText:   { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" },

  featureList:  { width: "100%", marginBottom: 24 },
  featureTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  featureText:  { fontSize: 13, color: "rgba(255,255,255,0.65)" },

  updateBtn:  { width: "100%", borderRadius: 15, overflow: "hidden", marginBottom: 24 },
  updateGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  updateText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  footer: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
});
