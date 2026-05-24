import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";

type FieldKey = "current" | "next" | "confirm";

const FIELDS: { key: FieldKey; label: string; placeholder: string; icon: "lock-closed-outline" | "lock-open-outline" | "checkmark-circle-outline" }[] = [
  { key: "current", label: "Current Password",     placeholder: "••••••••", icon: "lock-closed-outline"   },
  { key: "next",    label: "New Password",          placeholder: "••••••••", icon: "lock-open-outline"     },
  { key: "confirm", label: "Confirm New Password",  placeholder: "••••••••", icon: "checkmark-circle-outline" },
];

export default function ChangePasswordScreen() {
  const Colors = useColors();
  const { user, logout } = useAuth();

  const [values,  setValues]  = useState<Record<FieldKey, string>>({ current: "", next: "", confirm: "" });
  const [show,    setShow]    = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint =
    user?.role === "GROUND_OWNER"
      ? "/api/ground-owner/force-change-password"
      : "/api/user/password";

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },

    scroll: { paddingHorizontal: 20, paddingVertical: 40 },

    brandSection: { alignItems: "center", paddingBottom: 28 },
    iconCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    brandTitle:   { fontSize: 24, fontWeight: "800", color: Colors.white, letterSpacing: -0.5 },
    brandSub:     { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 },

    card:     { backgroundColor: Colors.card, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
    badge:    { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: Colors.warningLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14, borderWidth: 1, borderColor: "#fde68a" },
    badgeText:{ fontSize: 12, fontWeight: "600", color: Colors.warning },
    cardTitle:{ fontSize: 22, fontWeight: "800", color: Colors.text, marginBottom: 4 },
    cardSub:  { fontSize: 14, color: Colors.textMuted, marginBottom: 20, lineHeight: 20 },

    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" },
    errorText:{ fontSize: 13, color: Colors.error, flex: 1 },

    fieldGroup:      { gap: 14, marginBottom: 20 },
    fieldLabel:      { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:       { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceAlt, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, height: 52 },
    inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: Colors.card },
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, fontSize: 15, color: Colors.text },

    btn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, height: 52, gap: 8 },
    btnDisabled:{ opacity: 0.6 },
    btnText:    { fontSize: 16, fontWeight: "700", color: Colors.white },

    logoutRow:  { alignItems: "center", marginTop: 16 },
    logoutText: { fontSize: 14, color: Colors.textMuted },
  });

  async function handleSubmit() {
    if (!values.current || !values.next || !values.confirm) {
      setError("All fields are required.");
      return;
    }
    if (values.next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (values.next !== values.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.put(endpoint, { currentPassword: values.current, newPassword: values.next });
      await logout();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Branding */}
          <View style={s.brandSection}>
            <View style={s.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={36} color={Colors.white} />
            </View>
            <Text style={s.brandTitle}>Security Update</Text>
            <Text style={s.brandSub}>Update required before you continue</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.badge}>
              <Ionicons name="warning-outline" size={13} color={Colors.warning} />
              <Text style={s.badgeText}>Action required</Text>
            </View>
            <Text style={s.cardTitle}>Change your password</Text>
            <Text style={s.cardSub}>
              Your account requires a password change before you can continue.
            </Text>

            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.fieldGroup}>
              {FIELDS.map(({ key, label, placeholder, icon }) => (
                <View key={key}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <View style={[s.inputWrap, focused === key && s.inputWrapFocused]}>
                    <Ionicons
                      name={icon}
                      size={18}
                      color={focused === key ? Colors.primary : Colors.textMuted}
                      style={s.inputIcon}
                    />
                    <TextInput
                      style={s.input}
                      placeholder={placeholder}
                      placeholderTextColor={Colors.textMuted}
                      value={values[key]}
                      onChangeText={(t) => setValues((v) => ({ ...v, [key]: t }))}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused(null)}
                      secureTextEntry={!show[key]}
                      returnKeyType={key === "confirm" ? "done" : "next"}
                      onSubmitEditing={key === "confirm" ? handleSubmit : undefined}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={show[key] ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
                      <Text style={s.btnText}>Update Password</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.logoutRow} onPress={logout}>
              <Text style={s.logoutText}>Sign out instead</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
