import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";

export default function LoginScreen() {
  const Colors = useColors();
  const router  = useRouter();
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState<"email" | "password" | null>(null);

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },

    brandSection: { alignItems: "center", paddingTop: 64, paddingBottom: 28 },
    logoWrap:     { width: 80, height: 80, borderRadius: 40, overflow: "hidden", marginBottom: 10 },
    logo:         { width: 80, height: 80 },
    appName:      { fontSize: 32, fontWeight: "900", color: Colors.white, letterSpacing: -0.5 },
    taglineRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    taglineDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },
    tagline:      { fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" },

    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    card:       { backgroundColor: Colors.card, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
    cardAccent: { height: 3, backgroundColor: Colors.primary },
    cardInner:  { padding: 24 },
    cardTitle:  { fontSize: 22, fontWeight: "800", color: Colors.text, marginBottom: 4 },
    cardSub:    { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },

    errorBox:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" },
    errorText: { fontSize: 13, color: Colors.error, flex: 1 },

    fieldGroup:       { gap: 12, marginBottom: 20 },
    inputWrap:        { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceAlt, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, height: 52 },
    inputWrapFocused: { borderColor: Colors.primary, backgroundColor: Colors.card },
    inputIcon:        { marginRight: 10 },
    input:            { flex: 1, fontSize: 15, color: Colors.text },

    forgotRow:  { alignItems: "flex-end", marginTop: -6, marginBottom: 12 },
    forgotText: { fontSize: 13, fontWeight: "600", color: Colors.primary },

    btn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, height: 52, gap: 8 },
    btnDisabled: { opacity: 0.6 },
    btnText:     { fontSize: 16, fontWeight: "700", color: Colors.white },
    btnIcon:     { marginTop: 1 },

    note: { fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 16 },

    divider:     { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 18 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
    dividerText: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },

    applyCard:    { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    applyCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    applyIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primary + "22", alignItems: "center", justifyContent: "center" },
    applyTitle:   { fontSize: 15, fontWeight: "800", color: "#fff" },
    applySub:     { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18, marginBottom: 14 },
    applyBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 13, height: 46 },
    applyBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

    bottomHint:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 },
    bottomHintText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  });

  async function handleLogin() {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      await login(trimEmail, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" />

      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>

        {/* Top branding */}
        <View style={s.brandSection}>
          <View style={s.logoWrap}>
            <Image source={require("../../assets/icon.png")} style={s.logo} resizeMode="cover" />
          </View>
          <Text style={s.appName}>GoPlay</Text>
          <View style={s.taglineRow}>
            <View style={s.taglineDot} />
            <Text style={s.tagline}>Facility Management</Text>
            <View style={s.taglineDot} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Login card */}
          <View style={s.card}>
            <View style={s.cardAccent} />
            <View style={s.cardInner}>
              <Text style={s.cardTitle}>Welcome back</Text>
              <Text style={s.cardSub}>Sign in to your facility account</Text>

              {!!error && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              <View style={s.fieldGroup}>
                <View style={[s.inputWrap, focused === "email" && s.inputWrapFocused]}>
                  <Ionicons name="mail-outline" size={18} color={focused === "email" ? Colors.primary : Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>

                <View style={[s.inputWrap, focused === "password" && s.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focused === "password" ? Colors.primary : Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { marginRight: 8 }]}
                    placeholder="Password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={s.forgotRow} onPress={() => router.push("/(auth)/forgot-password")} activeOpacity={0.7}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={[s.btn, loading && s.btnDisabled]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <>
                        <Text style={s.btnText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={18} color={Colors.white} style={s.btnIcon} />
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <Text style={s.note}>For facility owners and workers only</Text>
            </View>
          </View>

          {/* New to GoPlay */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>New to GoPlay?</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.applyCard}>
            <View style={s.applyCardTop}>
              <View style={s.applyIconBox}>
                <Ionicons name="business-outline" size={19} color={Colors.primary} />
              </View>
              <Text style={s.applyTitle}>Become a Ground Owner</Text>
            </View>
            <Text style={s.applySub}>
              List your sports facility on GoPlay and start receiving bookings. Apply in minutes — our team reviews within 1–3 business days.
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/apply")} activeOpacity={0.88}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={s.applyBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={s.applyBtnText}>Apply Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.bottomHint}>
            <Ionicons name="globe-outline" size={13} color="rgba(255,255,255,0.4)" />
            <Text style={s.bottomHintText}>Players book at goplay.lk</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
