import { useState, useEffect, useRef } from "react";
import { useKeyboardPadding } from "@/lib/keyboard";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/lib/theme";
import { BASE_URL } from "@/lib/api";
import { useAuth, PENDING_APP_KEY } from "@/lib/auth";
import { useT } from "@/lib/i18n/I18nProvider";
import { tk } from "@/lib/i18n/core";

function FieldInput({ label, value, onChange, placeholder, keyboardType, icon, secure, showToggle, onToggle, multiline, colors }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; icon?: string;
  secure?: boolean; showToggle?: boolean; onToggle?: () => void; multiline?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const [focused, setFocused] = useState(false);
  const s = fieldStyles(colors);
  if (multiline) {
    return (
      <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <TextInput
          style={[s.textArea, focused && s.textAreaFocused]}
          value={value} onChangeText={onChange}
          placeholder={placeholder} placeholderTextColor={colors.textMuted}
          multiline numberOfLines={3}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      </View>
    );
  }
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
        {icon && <Ionicons name={icon as never} size={17} color={focused ? colors.primary : colors.textMuted} style={s.inputIcon} />}
        <TextInput
          style={s.input}
          value={value}
          onChangeText={(v) => onChange(secure ? v.replace(/\s/g, "") : v)}
          placeholder={placeholder} placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType ?? "default"}
          secureTextEntry={secure && !showToggle}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          autoCapitalize={secure || keyboardType === "email-address" ? "none" : "sentences"}
          autoCorrect={false}
        />
        {secure !== undefined && (
          <TouchableOpacity onPress={onToggle} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showToggle ? "eye-outline" : "eye-off-outline"} size={17} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function fieldStyles(Colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    field:           { marginBottom: 14 },
    fieldLabel:      { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:       { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderRadius: 13, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 13, height: 50 },
    inputWrapFocused:{ borderColor: Colors.primary },
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, fontSize: 15, color: Colors.text },
    eyeBtn:          { padding: 4 },
    textArea:        { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 13, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: Colors.text, minHeight: 90, textAlignVertical: "top" },
    textAreaFocused: { borderColor: Colors.primary },
  });
}

const AMENITIES = [
  tk("Parking"), tk("Changing Rooms"), tk("Showers"), tk("Floodlights"),
  tk("Cafeteria"), tk("WiFi"), tk("Toilets"), tk("First Aid"),
  tk("Drinking Water"), tk("Equipment Rental"), tk("Seating Area"),
  tk("Security / CCTV"), tk("Air Conditioning"), tk("Coaching Available"), tk("Scoreboard"),
];

const STEP_LABELS = [tk("Account"), tk("Personal"), tk("Facility"), tk("Review")];

interface Category { id: string; name: string; icon: string | null }

export default function ApplyScreen() {
  const { t } = useT();
  const keyboardPad = useKeyboardPadding();
  const Colors = useColors();
  const router  = useRouter();
  const { clearPendingApp } = useAuth();

  const [step,      setStep]      = useState(0);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Account
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  // Personal
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("");

  // Facility
  const [facilityName,        setFacilityName]        = useState("");
  const [facilityAddress,     setFacilityAddress]     = useState("");
  const [facilityCity,        setFacilityCity]        = useState("");
  const [categoryIds,         setCategoryIds]         = useState<string[]>([]);
  const [proposedHourlyRate,  setProposedHourlyRate]  = useState("");
  const [capacity,            setCapacity]            = useState("");
  const [amenities,           setAmenities]           = useState<string[]>([]);
  const [facilityDescription, setFacilityDescription] = useState("");

  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetch(`${BASE_URL}/api/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const s = StyleSheet.create({
    flex: { flex: 1 },
    bg:   { flex: 1 },

    safeTop: { backgroundColor: "transparent" },

    header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    backBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
    headerTitle:{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#fff", marginRight: 40 },

    stepBar:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
    stepItem:    { alignItems: "center", flex: 1 },
    stepCircle:  { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    stepNum:     { fontSize: 13, fontWeight: "800" },
    stepLabel:   { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
    stepLine:    { height: 2, flex: 1, marginBottom: 18, marginHorizontal: 2 },

    scroll:   { paddingHorizontal: 16, paddingBottom: 24 },
    card:     { backgroundColor: Colors.card, borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },

    sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 4 },
    sectionSub:   { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },

    errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#fecaca" },
    errorText:{ fontSize: 13, color: Colors.error, flex: 1, lineHeight: 19 },

    tagsWrap:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag:       { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    tagText:   { fontSize: 13, fontWeight: "600" },

    reviewSection: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    reviewLabel:   { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },
    reviewRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    reviewKey:     { fontSize: 13, color: Colors.textMuted, flex: 1 },
    reviewVal:     { fontSize: 13, fontWeight: "600", color: Colors.text, flex: 2, textAlign: "right" },

    disclaimer: { backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fde68a", marginTop: 4 },
    disclText:  { fontSize: 12, color: "#92400e", lineHeight: 18 },

    termsBox:   { backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.border, marginTop: 12 },
    termsTitle: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },
    termsBullet:{ flexDirection: "row", gap: 6, marginBottom: 5 },
    termsDot:   { fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
    termsItem:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, flex: 1 },
    checkRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
    checkBox:   { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    checkBoxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkLabel: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 18 },

    navFooter:  { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 20, backgroundColor: "transparent", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
    backNavBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.08)" },
    backNavText:{ fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.75)" },
    nextBtn:    { flex: 2, borderRadius: 14, height: 52, overflow: "hidden" },
    nextGrad:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    nextText:   { fontSize: 15, fontWeight: "700", color: Colors.white },

    // Success screen
    successBg:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    successCircle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
    successTitle:   { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 },
    successSub:     { fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 22, marginBottom: 8 },
    successNote:    { fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 36 },
    statusBtn:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 32 },
    statusBtnText:  { fontSize: 16, fontWeight: "800", color: Colors.primary },
    loginLink:      { marginTop: 14 },
    loginLinkText:  { fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  });

  function validateStep(): boolean {
    if (step === 0) {
      if (!name.trim() || name.trim().length < 2) return err(t("Name must be at least 2 characters."));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return err(t("Enter a valid email address."));
      const cleaned = phone.replace(/[\s\-().+]/g, "");
      if (!/^(?:94|0)7[0-9]{8}$/.test(cleaned)) return err(t("Enter a valid Sri Lankan mobile number (e.g. 077 123 4567)."));
      if (password.length < 8) return err(t("Password must be at least 8 characters."));
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return err(t("Password must contain at least one letter and one number."));
      if (password !== confirmPassword) return err(t("Passwords do not match."));
    }
    if (step === 1) {
      if (!address.trim() || address.trim().length < 5) return err(t("Please enter a valid address (at least 5 characters)."));
      if (!city.trim() || city.trim().length < 2) return err(t("Please enter a valid city name."));
    }
    if (step === 2) {
      if (!facilityName.trim()) return err(t("Facility name is required."));
      if (categoryIds.length === 0) return err(t("Please select at least one sport."));
      if (!facilityAddress.trim()) return err(t("Facility address is required."));
      if (!facilityCity.trim()) return err(t("Facility city is required."));
      if (!proposedHourlyRate || Number(proposedHourlyRate) < 1) return err(t("Please enter a valid hourly rate."));
    }
    setError("");
    return true;
  }

  function err(msg: string): false {
    setError(msg);
    return false;
  }

  function next() {
    if (validateStep()) setStep((s) => s + 1);
  }
  function back() {
    setError("");
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  }

  async function handleSubmit() {
    if (!agreedToTerms) { setError(t("You must agree to the Terms & Conditions to proceed.")); return; }
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/mobile-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(),
          address: address.trim(), city: city.trim(),
          facilityName: facilityName.trim(), facilityAddress: facilityAddress.trim(), facilityCity: facilityCity.trim(),
          categoryIds,
          proposedHourlyRate: Number(proposedHourlyRate),
          capacity: capacity ? Number(capacity) : undefined,
          amenities,
          facilityDescription: facilityDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("Submission failed. Please try again.")); return; }

      await SecureStore.setItemAsync(PENDING_APP_KEY, email.trim().toLowerCase());
      // no-op: AuthContext reads PENDING_APP_KEY on next mount via clearPendingApp

      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      setSubmitted(true);
    } catch {
      setError(t("Network error — check your internet connection."));
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <StatusBar style="light" />
        <Animated.View style={[s.successBg, { opacity: successAnim, transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark-circle" size={52} color="#bbf7d0" />
          </View>
          <Text style={s.successTitle}>{t("Application Submitted!")}</Text>
          <Text style={s.successSub}>
            {t("Your provider application is now under review by our team.")}
          </Text>
          <Text style={s.successNote}>
            {t("You'll receive an email notification once it's reviewed.")}
          </Text>
          <TouchableOpacity
            style={s.statusBtn}
            onPress={() => router.replace("/(auth)/application-status")}
            activeOpacity={0.85}
          >
            <Ionicons name="timer-outline" size={20} color={Colors.primary} />
            <Text style={s.statusBtnText}>{t("Check Application Status")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.loginLink} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.loginLinkText}>{t("Back to Sign In")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  function StepBar() {
    return (
      <View style={s.stepBar}>
        {STEP_LABELS.map((label, i) => {
          const done    = step > i;
          const active  = step === i;
          const circleBg = done ? Colors.primary : active ? Colors.primary : Colors.border;
          const numColor = done || active ? "#fff" : Colors.textMuted;
          const lblColor = active ? Colors.primary : done ? Colors.primary : Colors.textMuted;
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={s.stepItem}>
                <View style={[s.stepCircle, { backgroundColor: circleBg }]}>
                  {done
                    ? <Ionicons name="checkmark" size={15} color="#fff" />
                    : <Text style={[s.stepNum, { color: numColor }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[s.stepLabel, { color: lblColor }]}>{label}</Text>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View style={[s.stepLine, { backgroundColor: step > i ? Colors.primary : Colors.border, marginBottom: 20 }]} />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.flex} enabled={false}>
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <SafeAreaView style={s.safeTop} edges={["top"]}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={back}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{t("Become a Provider")}</Text>
          </View>

          {/* Step bar */}
          <StepBar />
        </SafeAreaView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, keyboardPad > 0 && { paddingBottom: keyboardPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.card}>
            {/* ── Step 0: Account Info ──────────────────────────────────────── */}
            {step === 0 && (
              <>
                <Text style={s.sectionTitle}>{t("Create Your Account")}</Text>
                <Text style={s.sectionSub}>{t("Start by setting up your login credentials.")}</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{t(error)}</Text></View>}
                <FieldInput label={t("FULL NAME *")} value={name} onChange={setName} placeholder={t("Your full name")} icon="person-outline"  colors={Colors}/>
                <FieldInput label={t("EMAIL ADDRESS *")} value={email} onChange={setEmail} placeholder={t("you@example.com")} keyboardType="email-address" icon="mail-outline"  colors={Colors}/>
                <FieldInput label={t("MOBILE NUMBER *")} value={phone} onChange={setPhone} placeholder="077 123 4567" keyboardType="phone-pad" icon="call-outline"  colors={Colors}/>
                <FieldInput label={t("PASSWORD *")} value={password} onChange={setPassword} placeholder={t("Min 8 chars, include a number")} icon="lock-closed-outline" secure showToggle={showPass} onToggle={() => setShowPass((v) => !v)}  colors={Colors}/>
                <FieldInput label={t("CONFIRM PASSWORD *")} value={confirmPassword} onChange={setConfirmPassword} placeholder={t("Re-enter your password")} icon="lock-closed-outline" secure showToggle={showConfirm} onToggle={() => setShowConfirm((v) => !v)}  colors={Colors}/>
              </>
            )}

            {/* ── Step 1: Personal Info ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <Text style={s.sectionTitle}>{t("Your Details")}</Text>
                <Text style={s.sectionSub}>{t("Tell us where you're based. This stays private.")}</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{t(error)}</Text></View>}
                <FieldInput label={t("HOME / BUSINESS ADDRESS *")} value={address} onChange={setAddress} placeholder={t("Street address")} icon="home-outline"  colors={Colors}/>
                <FieldInput label={t("CITY *")} value={city} onChange={setCity} placeholder={t("e.g. Colombo")} icon="location-outline"  colors={Colors}/>
              </>
            )}

            {/* ── Step 2: Facility Details ──────────────────────────────────── */}
            {step === 2 && (
              <>
                <Text style={s.sectionTitle}>{t("Your Facility")}</Text>
                <Text style={s.sectionSub}>{t("Tell us about the sports ground you want to list.")}</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{t(error)}</Text></View>}
                <FieldInput label={t("FACILITY NAME *")} value={facilityName} onChange={setFacilityName} placeholder={t("e.g. Colombo Cricket Academy")} icon="business-outline"  colors={Colors}/>
                <FieldInput label={t("FACILITY ADDRESS *")} value={facilityAddress} onChange={setFacilityAddress} placeholder={t("Street address of the ground")} icon="location-outline"  colors={Colors}/>
                <FieldInput label={t("FACILITY CITY *")} value={facilityCity} onChange={setFacilityCity} placeholder={t("e.g. Colombo")} icon="map-outline"  colors={Colors}/>

                <View style={s.field}>
                  <Text style={s.fieldLabel}>
                    SPORTS *{categoryIds.length > 0 && <Text style={{ color: Colors.primary, fontWeight: "700" }}>  {categoryIds.length} selected</Text>}
                  </Text>
                  <View style={s.tagsWrap}>
                    {categories.map((c) => {
                      const on = categoryIds.includes(c.id);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[s.tag, { backgroundColor: on ? Colors.primary : Colors.background, borderColor: on ? Colors.primary : Colors.border }]}
                          onPress={() => toggleCategory(c.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[s.tagText, { color: on ? "#fff" : Colors.text }]}>
                            {c.icon ? `${c.icon} ` : ""}{c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {categories.length === 0 && <ActivityIndicator size="small" color={Colors.textMuted} />}
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FieldInput label={t("HOURLY RATE (RS.) *")} value={proposedHourlyRate} onChange={setProposedHourlyRate} placeholder="2500" keyboardType="numeric" icon="cash-outline"  colors={Colors}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldInput label={t("CAPACITY")} value={capacity} onChange={setCapacity} placeholder="22" keyboardType="numeric" icon="people-outline"  colors={Colors}/>
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.fieldLabel}>{t("AMENITIES")}</Text>
                  <View style={s.tagsWrap}>
                    {AMENITIES.map((a) => {
                      const on = amenities.includes(a);
                      return (
                        <TouchableOpacity
                          key={a}
                          style={[s.tag, { backgroundColor: on ? Colors.primaryLight : Colors.background, borderColor: on ? Colors.primary : Colors.border }]}
                          onPress={() => toggleAmenity(a)}
                          activeOpacity={0.8}
                        >
                          <Text style={[s.tagText, { color: on ? Colors.primary : Colors.text }]}>{t(a)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <FieldInput label={t("DESCRIPTION")} value={facilityDescription} onChange={setFacilityDescription} placeholder={t("Describe your facility, rules, and what makes it special…")} multiline  colors={Colors}/>
              </>
            )}

            {/* ── Step 3: Review ────────────────────────────────────────────── */}
            {step === 3 && (
              <>
                <Text style={s.sectionTitle}>{t("Review & Submit")}</Text>
                <Text style={s.sectionSub}>{t("Please review your details before submitting.")}</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{t(error)}</Text></View>}

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>{t("ACCOUNT")}</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Name")}</Text><Text style={s.reviewVal}>{name.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Email")}</Text><Text style={s.reviewVal}>{email.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Phone")}</Text><Text style={s.reviewVal}>{phone.trim()}</Text></View>
                </View>

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>{t("PERSONAL")}</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Address")}</Text><Text style={s.reviewVal}>{address.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("City")}</Text><Text style={s.reviewVal}>{city.trim()}</Text></View>
                </View>

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>{t("FACILITY")}</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Name")}</Text><Text style={s.reviewVal}>{facilityName.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Sports")}</Text>
                    <Text style={s.reviewVal}>
                      {categoryIds.map((id) => categories.find((c) => c.id === id)?.name ?? id).join(", ") || "—"}
                    </Text>
                  </View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Location")}</Text><Text style={s.reviewVal}>{facilityAddress.trim()}, {facilityCity.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Hourly Rate")}</Text><Text style={s.reviewVal}>Rs. {Number(proposedHourlyRate).toLocaleString()}</Text></View>
                  {capacity && <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Capacity")}</Text><Text style={s.reviewVal}>{capacity} players</Text></View>}
                  {amenities.length > 0 && <View style={s.reviewRow}><Text style={s.reviewKey}>{t("Amenities")}</Text><Text style={s.reviewVal}>{amenities.join(", ")}</Text></View>}
                </View>

                <View style={s.disclaimer}>
                  <Text style={s.disclText}>
                    {t("After submission, our team will review your application within 1–3 business days. Once approved, you'll receive an email and can log in to the GoPlay app. Your facility listing will also need a separate review before going live.")}
                  </Text>
                </View>

                <View style={s.termsBox}>
                  <Text style={s.termsTitle}>{t("Terms & Conditions")}</Text>
                  {[
                    t("GoPlay charges a platform commission on bookings made through GoPlay. Players pay you directly at the ground or by bank transfer."),
                    t("As a Ground Owner, you are responsible for maintaining your facility in good condition and honoring all confirmed bookings."),
                    t("You may manage your listings, set availability, add courts, and track earnings through the GoPlay Owner Dashboard."),
                    t("GoPlay may suspend or remove listings that violate platform guidelines or receive repeated complaints from users."),
                    t("All facility information you provide must be accurate. Misleading listings may result in account suspension."),
                  ].map((item, i) => (
                    <View key={i} style={s.termsBullet}>
                      <Text style={s.termsDot}>•</Text>
                      <Text style={s.termsItem}>{t(item)}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={s.checkRow}
                    onPress={() => setAgreedToTerms((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkBox, agreedToTerms && s.checkBoxOn]}>
                      {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={s.checkLabel}>
                      {t("I have read and agree to the Terms & Conditions above, including the platform commission policy.")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* ── Navigation buttons — fixed footer, always visible ─────────────── */}
        <SafeAreaView edges={["bottom"]} style={[{ backgroundColor: "transparent" }, keyboardPad > 0 && { marginBottom: keyboardPad }]}>
          <View style={s.navFooter}>
            {step > 0 && (
              <TouchableOpacity style={s.backNavBtn} onPress={back}>
                <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.75)" />
                <Text style={s.backNavText}>{t("Back")}</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity style={[s.nextBtn, step === 0 && { flex: 1 }]} onPress={next} activeOpacity={0.88}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.nextText}>{t("Continue")}</Text>
                  <Ionicons name="chevron-forward" size={17} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.nextBtn, { flex: step > 0 ? 2 : 1, opacity: (loading || !agreedToTerms) ? 0.55 : 1 }]}
                onPress={handleSubmit}
                disabled={loading || !agreedToTerms}
                activeOpacity={0.88}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <>
                        <Ionicons name="send-outline" size={17} color={Colors.white} />
                        <Text style={s.nextText}>{t("Submit Application")}</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
