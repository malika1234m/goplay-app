import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";
import { useAuth, PENDING_APP_KEY } from "@/lib/auth";
import { BASE_URL } from "@/lib/api";

type AppStatus = "PENDING" | "APPROVED" | "REJECTED" | "NOT_FOUND" | null;

interface StatusData {
  status: AppStatus;
  name?: string;
  submittedAt?: string;
  rejectionReason?: string;
}

export default function ApplicationStatusScreen() {
  const Colors = useColors();
  const router  = useRouter();
  const { clearPendingApp } = useAuth();

  const [data,        setData]        = useState<StatusData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [email,       setEmail]       = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fetchStatus = useCallback(async (applicantEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/mobile-application-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: applicantEmail }),
      });
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    import("expo-secure-store").then(({ getItemAsync }) => {
      getItemAsync(PENDING_APP_KEY).then((storedEmail) => {
        if (storedEmail) {
          setEmail(storedEmail);
          fetchStatus(storedEmail);
        } else {
          setLoading(false);
        }
      });
    });
  }, [fetchStatus]);

  useEffect(() => {
    if (data?.status !== "PENDING" || !email) return;
    const id = setInterval(() => fetchStatus(email), 30_000);
    return () => clearInterval(id);
  }, [data?.status, email, fetchStatus]);

  async function handleRefresh() {
    if (!email) return;
    await fetchStatus(email);
  }

  async function handleApproved() {
    await clearPendingApp();        // clears SecureStore AND updates AuthContext state synchronously
    router.replace("/(auth)/login");
  }

  async function handleReapply() {
    await clearPendingApp();
    router.replace("/(auth)/apply");
  }

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },
    safe: { flex: 1 },

    header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#fff", marginRight: 40 },

    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },

    iconRing: { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 2 },
    title:    { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 },
    sub:      { fontSize: 15, color: "rgba(255,255,255,0.72)", textAlign: "center", lineHeight: 22, marginBottom: 6 },
    detail:   { fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 32 },

    emailPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    emailText: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: "500" },

    primaryBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 28, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
    primaryBtnText: { fontSize: 16, fontWeight: "800" },

    secondaryBtn:     { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", marginBottom: 8 },
    secondaryBtnText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.65)" },

    refreshRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    refreshText:{ fontSize: 12, color: "rgba(255,255,255,0.35)" },

    rejectCard:   { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", width: "100%" },
    rejectLabel:  { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    rejectReason: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  });

  if (loading && !data) {
    return (
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <StatusBar style="light" />
        <View style={s.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[s.detail, { marginBottom: 0, marginTop: 16 }]}>Checking your application…</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── PENDING ────────────────────────────────────────────────────────────────
  if (!data || data.status === "PENDING") {
    return (
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <StatusBar style="light" />
        <SafeAreaView style={s.safe} edges={["top"]}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Application Status</Text>
          </View>
        </SafeAreaView>
        <Animated.View style={[s.container, { opacity: fadeAnim }]}>
          <Animated.View style={[
            s.iconRing,
            { backgroundColor: "#d97706" + "22", borderColor: "#d97706" + "55" },
            { transform: [{ scale: pulseAnim }] },
          ]}>
            <Ionicons name="time-outline" size={50} color="#fbbf24" />
          </Animated.View>

          <Text style={s.title}>Under Review</Text>
          <Text style={s.sub}>Your application is being reviewed by our team.</Text>
          <Text style={s.detail}>We'll send you an email once it's processed.</Text>

          {!!email && (
            <View style={s.emailPill}>
              <Ionicons name="mail-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={s.emailText}>{email}</Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryBtn} onPress={handleRefresh} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
            }
            <Text style={[s.primaryBtnText, { color: Colors.primary }]}>Refresh Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleApproved} activeOpacity={0.85}>
            <Ionicons name="arrow-back-outline" size={16} color="rgba(255,255,255,0.65)" />
            <Text style={s.secondaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>

          {lastChecked && (
            <View style={s.refreshRow}>
              <Ionicons name="checkmark-outline" size={12} color="rgba(255,255,255,0.3)" />
              <Text style={s.refreshText}>
                Last checked {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── APPROVED ───────────────────────────────────────────────────────────────
  if (data.status === "APPROVED") {
    return (
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <StatusBar style="light" />
        <Animated.View style={[s.container, { opacity: fadeAnim }]}>
          <View style={[s.iconRing, { backgroundColor: Colors.primary + "22", borderColor: Colors.primary + "55" }]}>
            <Ionicons name="checkmark-circle" size={52} color="#bbf7d0" />
          </View>

          <Text style={s.title}>
            {data.name ? `Welcome, ${data.name.split(" ")[0]}!` : "You're Approved!"}
          </Text>
          <Text style={s.sub}>Your provider application has been approved. You're now a Ground Owner on GoPlay.</Text>
          <Text style={s.detail}>Log in below to access your dashboard and start managing your facility.</Text>

          <TouchableOpacity style={s.primaryBtn} onPress={handleApproved} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={20} color={Colors.primary} />
            <Text style={[s.primaryBtnText, { color: Colors.primary }]}>Log In Now</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── REJECTED ───────────────────────────────────────────────────────────────
  if (data.status === "REJECTED") {
    return (
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <StatusBar style="light" />
        <Animated.View style={[s.container, { opacity: fadeAnim }]}>
          <View style={[s.iconRing, { backgroundColor: Colors.error + "22", borderColor: Colors.error + "55" }]}>
            <Ionicons name="close-circle-outline" size={52} color="#fca5a5" />
          </View>

          <Text style={s.title}>Application Not Approved</Text>
          <Text style={s.sub}>Unfortunately your application was not approved at this time.</Text>

          {!!data.rejectionReason && (
            <View style={s.rejectCard}>
              <Text style={s.rejectLabel}>Reason from Admin</Text>
              <Text style={s.rejectReason}>{data.rejectionReason}</Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryBtn} onPress={handleReapply} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
            <Text style={[s.primaryBtnText, { color: Colors.primary }]}>Apply Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleApproved} activeOpacity={0.85}>
            <Text style={s.secondaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── NOT_FOUND fallback ─────────────────────────────────────────────────────
  return (
    <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
      <StatusBar style="light" />
      <View style={s.container}>
        <Ionicons name="alert-circle-outline" size={56} color="rgba(255,255,255,0.3)" style={{ marginBottom: 20 }} />
        <Text style={s.title}>No Application Found</Text>
        <Text style={s.detail}>We couldn't find an application associated with your account.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={handleReapply} activeOpacity={0.85}>
          <Text style={[s.primaryBtnText, { color: Colors.primary }]}>Start Application</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
