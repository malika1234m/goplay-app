import { useState, useEffect, useRef } from "react";
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

export const PENDING_APP_KEY = "goplay_pending_app";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const AMENITIES = [
  "Parking", "Changing Rooms", "Showers", "Floodlights",
  "Cafeteria", "WiFi", "Toilets", "First Aid",
  "Drinking Water", "Equipment Rental", "Seating Area",
  "Security / CCTV", "Air Conditioning", "Coaching Available", "Scoreboard",
];

const STEP_LABELS = ["Account", "Personal", "Facility", "Review"];

interface Category { id: string; name: string; icon: string | null }

export default function ApplyScreen() {
  const Colors = useColors();
  const router  = useRouter();

  const [step,      setStep]      = useState(0);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

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

    scroll:   { paddingHorizontal: 16, paddingBottom: 48 },
    card:     { backgroundColor: Colors.card, borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },

    sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 4 },
    sectionSub:   { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },

    errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#fecaca" },
    errorText:{ fontSize: 13, color: Colors.error, flex: 1, lineHeight: 19 },

    field:           { marginBottom: 14 },
    fieldLabel:      { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:       { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderRadius: 13, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 13, height: 50 },
    inputWrapFocused:{ borderColor: Colors.primary },
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, fontSize: 15, color: Colors.text },
    eyeBtn:          { padding: 4 },

    tagsWrap:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag:       { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    tagText:   { fontSize: 13, fontWeight: "600" },

    textArea:  { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 13, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: Colors.text, minHeight: 90, textAlignVertical: "top" },
    textAreaFocused: { borderColor: Colors.primary },

    reviewSection: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    reviewLabel:   { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },
    reviewRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    reviewKey:     { fontSize: 13, color: Colors.textMuted, flex: 1 },
    reviewVal:     { fontSize: 13, fontWeight: "600", color: Colors.text, flex: 2, textAlign: "right" },

    disclaimer: { backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fde68a", marginTop: 4 },
    disclText:  { fontSize: 12, color: "#92400e", lineHeight: 18 },

    navRow:   { flexDirection: "row", gap: 10, marginTop: 20 },
    backNavBtn:{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: Colors.border },
    backNavText:{ fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    nextBtn:  { flex: 2, borderRadius: 14, height: 52, overflow: "hidden" },
    nextGrad: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    nextText: { fontSize: 15, fontWeight: "700", color: Colors.white },

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
      if (!name.trim() || name.trim().length < 2) return err("Name must be at least 2 characters.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return err("Enter a valid email address.");
      const cleaned = phone.replace(/[\s\-().+]/g, "");
      if (!/^(?:94|0)7[0-9]{8}$/.test(cleaned)) return err("Enter a valid Sri Lankan mobile number (e.g. 077 123 4567).");
      if (password.length < 8) return err("Password must be at least 8 characters.");
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return err("Password must contain at least one letter and one number.");
      if (password !== confirmPassword) return err("Passwords do not match.");
    }
    if (step === 1) {
      if (!address.trim() || address.trim().length < 5) return err("Please enter a valid address (at least 5 characters).");
      if (!city.trim() || city.trim().length < 2) return err("Please enter a valid city name.");
    }
    if (step === 2) {
      if (!facilityName.trim()) return err("Facility name is required.");
      if (categoryIds.length === 0) return err("Please select at least one sport.");
      if (!facilityAddress.trim()) return err("Facility address is required.");
      if (!facilityCity.trim()) return err("Facility city is required.");
      if (!proposedHourlyRate || Number(proposedHourlyRate) < 1) return err("Please enter a valid hourly rate.");
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
      if (!res.ok) { setError(data.error ?? "Submission failed. Please try again."); return; }

      await SecureStore.setItemAsync(PENDING_APP_KEY, email.trim().toLowerCase());

      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      setSubmitted(true);
    } catch {
      setError("Network error — check your internet connection.");
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

  function FieldInput({ label, value, onChange, placeholder, keyboardType, icon, secure, showToggle, onToggle, multiline }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; keyboardType?: any; icon?: string;
    secure?: boolean; showToggle?: boolean; onToggle?: () => void; multiline?: boolean;
  }) {
    const [focused, setFocused] = useState(false);
    if (multiline) {
      return (
        <View style={s.field}>
          <Text style={s.fieldLabel}>{label}</Text>
          <TextInput
            style={[s.textArea, focused && s.textAreaFocused]}
            value={value} onChangeText={onChange}
            placeholder={placeholder} placeholderTextColor={Colors.textMuted}
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
          {icon && <Ionicons name={icon as never} size={17} color={focused ? Colors.primary : Colors.textMuted} style={s.inputIcon} />}
          <TextInput
            style={s.input}
            value={value} onChangeText={onChange}
            placeholder={placeholder} placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType ?? "default"}
            secureTextEntry={secure && !showToggle}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
            autoCorrect={false}
          />
          {secure !== undefined && (
            <TouchableOpacity onPress={onToggle} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showToggle ? "eye-outline" : "eye-off-outline"} size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          <Text style={s.successTitle}>Application Submitted!</Text>
          <Text style={s.successSub}>
            Your provider application is now under review by our team.
          </Text>
          <Text style={s.successNote}>
            You'll receive an email notification once it's reviewed.
          </Text>
          <TouchableOpacity
            style={s.statusBtn}
            onPress={() => router.replace("/(auth)/application-status")}
            activeOpacity={0.85}
          >
            <Ionicons name="timer-outline" size={20} color={Colors.primary} />
            <Text style={s.statusBtnText}>Check Application Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.loginLink} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.loginLinkText}>Back to Sign In</Text>
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
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.navy, Colors.navyDark, "#0a1628"]} style={s.bg}>
        <SafeAreaView style={s.safeTop} edges={["top"]}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={back}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Become a Provider</Text>
          </View>

          {/* Step bar */}
          <StepBar />
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.card}>
            {/* ── Step 0: Account Info ──────────────────────────────────────── */}
            {step === 0 && (
              <>
                <Text style={s.sectionTitle}>Create Your Account</Text>
                <Text style={s.sectionSub}>Start by setting up your login credentials.</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{error}</Text></View>}
                <FieldInput label="FULL NAME *" value={name} onChange={setName} placeholder="Your full name" icon="person-outline" />
                <FieldInput label="EMAIL ADDRESS *" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" icon="mail-outline" />
                <FieldInput label="MOBILE NUMBER *" value={phone} onChange={setPhone} placeholder="077 123 4567" keyboardType="phone-pad" icon="call-outline" />
                <FieldInput label="PASSWORD *" value={password} onChange={setPassword} placeholder="Min 8 chars, include a number" icon="lock-closed-outline" secure showToggle={showPass} onToggle={() => setShowPass((v) => !v)} />
                <FieldInput label="CONFIRM PASSWORD *" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" icon="lock-closed-outline" secure showToggle={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </>
            )}

            {/* ── Step 1: Personal Info ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <Text style={s.sectionTitle}>Your Details</Text>
                <Text style={s.sectionSub}>Tell us where you're based. This stays private.</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{error}</Text></View>}
                <FieldInput label="HOME / BUSINESS ADDRESS *" value={address} onChange={setAddress} placeholder="Street address" icon="home-outline" />
                <FieldInput label="CITY *" value={city} onChange={setCity} placeholder="e.g. Colombo" icon="location-outline" />
              </>
            )}

            {/* ── Step 2: Facility Details ──────────────────────────────────── */}
            {step === 2 && (
              <>
                <Text style={s.sectionTitle}>Your Facility</Text>
                <Text style={s.sectionSub}>Tell us about the sports ground you want to list.</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{error}</Text></View>}
                <FieldInput label="FACILITY NAME *" value={facilityName} onChange={setFacilityName} placeholder="e.g. Colombo Cricket Academy" icon="business-outline" />
                <FieldInput label="FACILITY ADDRESS *" value={facilityAddress} onChange={setFacilityAddress} placeholder="Street address of the ground" icon="location-outline" />
                <FieldInput label="FACILITY CITY *" value={facilityCity} onChange={setFacilityCity} placeholder="e.g. Colombo" icon="map-outline" />

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
                    <FieldInput label="HOURLY RATE (RS.) *" value={proposedHourlyRate} onChange={setProposedHourlyRate} placeholder="2500" keyboardType="numeric" icon="cash-outline" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldInput label="CAPACITY" value={capacity} onChange={setCapacity} placeholder="22" keyboardType="numeric" icon="people-outline" />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.fieldLabel}>AMENITIES</Text>
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
                          <Text style={[s.tagText, { color: on ? Colors.primary : Colors.text }]}>{a}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <FieldInput label="DESCRIPTION" value={facilityDescription} onChange={setFacilityDescription} placeholder="Describe your facility, rules, and what makes it special…" multiline />
              </>
            )}

            {/* ── Step 3: Review ────────────────────────────────────────────── */}
            {step === 3 && (
              <>
                <Text style={s.sectionTitle}>Review & Submit</Text>
                <Text style={s.sectionSub}>Please review your details before submitting.</Text>
                {!!error && <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={s.errorText}>{error}</Text></View>}

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>ACCOUNT</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Name</Text><Text style={s.reviewVal}>{name.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Email</Text><Text style={s.reviewVal}>{email.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Phone</Text><Text style={s.reviewVal}>{phone.trim()}</Text></View>
                </View>

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>PERSONAL</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Address</Text><Text style={s.reviewVal}>{address.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>City</Text><Text style={s.reviewVal}>{city.trim()}</Text></View>
                </View>

                <View style={s.reviewSection}>
                  <Text style={s.reviewLabel}>FACILITY</Text>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Name</Text><Text style={s.reviewVal}>{facilityName.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Sports</Text>
                    <Text style={s.reviewVal}>
                      {categoryIds.map((id) => categories.find((c) => c.id === id)?.name ?? id).join(", ") || "—"}
                    </Text>
                  </View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Location</Text><Text style={s.reviewVal}>{facilityAddress.trim()}, {facilityCity.trim()}</Text></View>
                  <View style={s.reviewRow}><Text style={s.reviewKey}>Hourly Rate</Text><Text style={s.reviewVal}>Rs. {Number(proposedHourlyRate).toLocaleString()}</Text></View>
                  {capacity && <View style={s.reviewRow}><Text style={s.reviewKey}>Capacity</Text><Text style={s.reviewVal}>{capacity} players</Text></View>}
                  {amenities.length > 0 && <View style={s.reviewRow}><Text style={s.reviewKey}>Amenities</Text><Text style={s.reviewVal}>{amenities.join(", ")}</Text></View>}
                </View>

                <View style={s.disclaimer}>
                  <Text style={s.disclText}>
                    After submission, our team will review your application within 1–3 business days. Once approved, you'll receive an email and can log in to the GoPlay app. Your facility listing will also need a separate review before going live.
                  </Text>
                </View>
              </>
            )}

            {/* Navigation */}
            <View style={s.navRow}>
              {step > 0 && (
                <TouchableOpacity style={s.backNavBtn} onPress={back}>
                  <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
                  <Text style={s.backNavText}>Back</Text>
                </TouchableOpacity>
              )}

              {step < 3 ? (
                <TouchableOpacity style={[s.nextBtn, step === 0 && { flex: 1 }]} onPress={next} activeOpacity={0.88}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.nextText}>Continue</Text>
                    <Ionicons name="chevron-forward" size={17} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[s.nextBtn, { flex: step > 0 ? 2 : 1, opacity: loading ? 0.65 : 1 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading
                      ? <ActivityIndicator color={Colors.white} />
                      : <>
                          <Ionicons name="send-outline" size={17} color={Colors.white} />
                          <Text style={s.nextText}>Submit Application</Text>
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
