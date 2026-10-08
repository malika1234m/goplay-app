import { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Modal, Dimensions, Easing, ImageBackground,
} from "react-native";
import * as Updates from "expo-updates";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/lib/i18n/I18nProvider";

const { width } = Dimensions.get("window");

export default function OTAUpdateBanner() {
  const { t } = useT();
  const insets = useSafeAreaInsets();

  const { isUpdateAvailable, isUpdatePending, isDownloading, downloadProgress } = Updates.useUpdates();
  const isVisible = isUpdateAvailable || isDownloading || isUpdatePending;

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim  = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [isVisible]);

  // Auto-start download as soon as update is available
  useEffect(() => {
    if (isUpdateAvailable && !isDownloading && !isUpdatePending) {
      Updates.fetchUpdateAsync().catch(() => {});
    }
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  // Smooth progress bar fill
  useEffect(() => {
    if (downloadProgress !== undefined) {
      Animated.timing(progressAnim, {
        toValue:  downloadProgress,
        duration: 300,
        easing:   Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [downloadProgress]);

  // Shimmer sweep on bar
  useEffect(() => {
    if (isDownloading || isUpdateAvailable) {
      const loop = Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: false })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isDownloading, isUpdateAvailable]);

  if (!isVisible) return null;

  const pct      = downloadProgress !== undefined ? Math.round(downloadProgress * 100) : 0;
  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-(width * 0.4), width * 1.1] });

  const statusText = isUpdatePending
    ? "100%"
    : isDownloading
    ? `${pct}%`
    : t("Updating...");

  return (
    <Modal visible={isVisible} transparent animationType="none" statusBarTranslucent>
      <StatusBar style="light" />
      <Animated.View style={[s.container, { opacity: fadeAnim }]}>
        <ImageBackground
          source={require("../../background.png")}
          style={s.bg}
          resizeMode="cover"
        >
          {/* Subtle top gradient so logo text stays readable */}
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "transparent"]}
            style={s.topGrad}
          />

          {/* GoPlay logo at top */}
          <View style={[s.logoArea, { paddingTop: insets.top + 16 }]}>
            <Text style={s.logoText}>GOPLAY</Text>
          </View>

          {/* Bottom gradient + bar area */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            style={[s.bottomArea, { paddingBottom: Math.max(insets.bottom + 10, 28) }]}
          >
            {/* Percentage */}
            <Text style={s.pctText}>{statusText}</Text>

            {/* Progress bar */}
            <View style={s.track}>
              {isUpdatePending ? (
                <View style={[s.fill, { width: "100%" }]} />
              ) : (
                <Animated.View style={[s.fill, { width: barWidth }]}>
                  <Animated.View style={[s.shimmer, { transform: [{ translateX: shimmerX }] }]} />
                </Animated.View>
              )}
            </View>

            {/* Restart button — only when ready */}
            {isUpdatePending && (
              <TouchableOpacity style={s.restartBtn} onPress={handleRestart} activeOpacity={0.85}>
                <Text style={s.restartText}>{t("Restart Now")}</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </Modal>
  );
}

async function handleRestart() {
  await Updates.reloadAsync();
}

const s = StyleSheet.create({
  container: { flex: 1 },
  bg:        { flex: 1 },

  topGrad: {
    position: "absolute", top: 0, left: 0, right: 0, height: 160,
  },

  logoArea: {
    alignItems: "center",
    position:   "absolute",
    left: 0, right: 0, top: 0,
  },
  logoText: {
    fontSize:      36,
    fontWeight:    "900",
    color:         "#ffffff",
    letterSpacing: 4,
    textShadowColor:  "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  bottomArea: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: "center",
  },

  pctText: {
    fontSize:   22,
    fontWeight: "800",
    color:      "#ffffff",
    marginBottom: 10,
    textShadowColor:  "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  track: {
    width: "100%",
    height: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  fill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 4,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute", top: 0, bottom: 0, width: 60,
    backgroundColor: "rgba(255,255,255,0.35)",
    transform: [{ skewX: "-20deg" }],
  },

  restartBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 48,
    marginTop: 4,
  },
  restartText: {
    fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.3,
  },
});
