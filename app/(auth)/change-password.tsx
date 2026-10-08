import { useState, useEffect } from "react";
import { useKeyboardPadding } from "@/lib/keyboard";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { BASE_URL } from "@/lib/api";
import { useColors } from "@/lib/theme";
import * as SecureStore from "expo-secure-store";
import { useT } from "@/lib/i18n/I18nProvider";
import { tk } from "@/lib/i18n/core";

type FieldKey = "current" | "next" | "confirm";

const FIELDS: { key: FieldKey; label: string; placeholder: string; icon: "lock-closed-outline" | "lock-open-outline" | "checkmark-circle-outline" }[] = [
  { key: "current", label: tk("Current Password"),     placeholder: "••••••••", icon: "lock-closed-outline"   },
  { key: "next",    label: tk("New Password"),          placeholder: "••••••••", icon: "lock-open-outline"     },
  { key: "confirm", label: tk("Confirm New Password"),  placeholder: "••••••••", icon: "checkmark-circle-outline" },
];

export default function ChangePasswordScreen() {
  const { t } = useT();
  const keyboardPad = useKeyboardPadding();
  const Colors = useColors();
  const router = useRouter();
  const { logout } = useAuth();

  async function signOut() {
    await logout();
    router.replace("/(auth)/login");
  }

  const [values,  setValues]  = useState<Record<FieldKey, string>>({ current: "", next: "", confirm: "" });
  const [show,    setShow]    = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Android hardware back button → sign out
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      signOut();
      return true;
    });
    return () => sub.remove();
  }, []);

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },

    header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.white },
    signOutBtn:  { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    signOutText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.75)" },

    scroll: { paddingHorizontal: 20, paddingVertical: 24 },

    brandSection: { alignItems: "center", paddingBottom: 24 },
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
  });

  async function handleSubmit() {
    if (!values.current || !values.next || !values.confirm) {
      setError(t("All fields are required."));
      return;
    }
    if (values.next.length < 8) {
      setError(t("New password must be at least 8 characters."));
      return;
    }
    if (values.next === values.current) {
      setError(t("New password must be different from your current password."));
      return;
    }
    if (values.next !== values.confirm) {
      setError(t("Passwords do not match."));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("goplay_token");
      const res = await fetch(`${BASE_URL}/api/ground-owner/force-change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: values.current,
          newPassword:     values.next,
          confirmPassword: values.confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        await signOut();
        return;
      }
      if (!res.ok) {
        setError((data as any)?.error ?? t("Failed to update password."));
        return;
      }
      await signOut();
    } catch {
      setError(t("Network error — check your connection."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      enabled={false}
    >
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>

        {/* Fixed header — always visible above keyboard */}
        <SafeAreaView edges={["top"]}>
          <View style={s.header}>
            <Text style={s.headerTitle}>{t("Security Update")}</Text>
            <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={15} color="rgba(255,255,255,0.75)" />
              <Text style={s.signOutText}>{t("Sign out")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={[s.scroll, keyboardPad > 0 && { paddingBottom: keyboardPad }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Branding */}
          <View style={s.brandSection}>
            <View style={s.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={36} color={Colors.white} />
            </View>
            <Text style={s.brandTitle}>{t("Security Update")}</Text>
            <Text style={s.brandSub}>{t("Update required before you continue")}</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.badge}>
              <Ionicons name="warning-outline" size={13} color={Colors.warning} />
              <Text style={s.badgeText}>{t("Action required")}</Text>
            </View>
            <Text style={s.cardTitle}>{t("Change your password")}</Text>
            <Text style={s.cardSub}>
              {t("Your account requires a password change before you can continue.")}
            </Text>

            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={s.errorText}>{t(error)}</Text>
              </View>
            )}

            <View style={s.fieldGroup}>
              {FIELDS.map(({ key, label, placeholder, icon }) => (
                <View key={key}>
                  <Text style={s.fieldLabel}>{t(label)}</Text>
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
                      autoCapitalize="none"
                      autoCorrect={false}
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
                      <Text style={s.btnText}>{t("Update Password")}</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
