import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function LoadingScreen() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1, useNativeDriver: true, tension: 60, friction: 8,
    }).start();

    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <LinearGradient colors={["#1e3464", "#152647", "#0a1628"]} style={s.bg}>
      <StatusBar style="light" />

      <Animated.View style={[s.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <View style={s.logoCircle}>
          <Image source={require("@/assets/icon.png")} style={s.logo} resizeMode="cover" />
        </View>
      </Animated.View>

      <Text style={s.appName}>GoPlay</Text>
      <Text style={s.tagline}>FACILITY MANAGEMENT</Text>

      <View style={s.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[s.dot, { opacity: dot }]} />
        ))}
      </View>

      <Text style={s.loadingText}>Loading…</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg:         { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap:   { marginBottom: 20 },
  logoCircle: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 2.5, borderColor: "#16a34a" },
  logo:       { width: "100%", height: "100%" },
  appName:    { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
  tagline:    { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "700", letterSpacing: 2, marginBottom: 40 },
  dotsRow:    { flexDirection: "row", gap: 8, marginBottom: 12 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  loadingText:{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: "500" },
});
