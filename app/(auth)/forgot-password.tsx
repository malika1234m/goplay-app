import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useColors } from "@/lib/theme";
import { BASE_URL } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const Colors = useColors();
  const router  = useRouter();

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [focused, setFocused] = useState(false);

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },

    scroll: { paddingHorizontal: 20, paddingVertical: 40 },

    brandSection: { alignItems: "center", paddingBottom: 28 },
    iconCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    brandTitle:   { fontSize: 24, fontWeight: "800", color: Colors.white, letterSpacing: -0.5 },
    brandSub:     { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4, textAlign: "center" },

    card:     { backgroundColor: Colors.card, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
    cardTitle:{ fontSize: 22, fontWeight: "800", color: Colors.text, marginBottom: 4 },
    cardSub:  { fontSize: 14, color: Colors.textMuted, marginBottom: 24, lineHeight: 20 },

    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" },
    errorText:{ fontSize: 13, color: Colors.error, flex: 1 },

    fieldLabel:      { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:       { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceAlt, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, height: 52, marginBottom: 20 },
    inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: Colors.card },
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, fontSize: 15, color: Colors.text },

    btn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, height: 52, gap: 8 },
    btnDisabled:{ opacity: 0.6 },
    btnText:    { fontSize: 16, fontWeight: "700", color: Colors.white },

    backRow:  { alignItems: "center", marginTop: 16 },
    backText: { fontSize: 14, color: Colors.textMuted },

    successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + "22", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20, borderWidth: 1, borderColor: Colors.primary + "44" },
    successTitle:{ fontSize: 20, fontWeight: "800", color: Colors.text, textAlign: "center", marginBottom: 10 },
    successSub:  { fontSize: 14, color: Colors.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    successEmail:{ backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "center", marginBottom: 24 },
    successEmailText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  });

  async function handleSubmit() {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) { setError("Enter your email address."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimEmail }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Something went wrong.");
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.brandSection}>
            <View style={s.iconCircle}>
              <Ionicons name="lock-open-outline" size={32} color={Colors.white} />
            </View>
            <Text style={s.brandTitle}>Reset Password</Text>
            <Text style={s.brandSub}>Enter your account email and{"\n"}we'll send you a reset link</Text>
          </View>

          <View style={s.card}>
            {sent ? (
              <>
                <View style={s.successIcon}>
                  <Ionicons name="mail-open-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={s.successTitle}>Check your email</Text>
                <Text style={s.successSub}>
                  If an account exists for this address, a password reset link has been sent. It expires in 1 hour.
                </Text>
                <View style={s.successEmail}>
                  <Text style={s.successEmailText}>{email.trim().toLowerCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.88}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={s.btn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.white} />
                    <Text style={s.btnText}>Back to Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.cardTitle}>Forgot your password?</Text>
                <Text style={s.cardSub}>Enter the email address associated with your GoPlay account.</Text>

                {!!error && (
                  <View style={s.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={s.fieldLabel}>Email Address</Text>
                <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
                  <Ionicons name="mail-outline" size={18} color={focused ? Colors.primary : Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={[s.btn, loading && s.btnDisabled]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading
                      ? <ActivityIndicator color={Colors.white} />
                      : <>
                          <Text style={s.btnText}>Send Reset Link</Text>
                          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={s.backRow} onPress={() => router.back()} activeOpacity={0.7}>
                  <Text style={s.backText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
