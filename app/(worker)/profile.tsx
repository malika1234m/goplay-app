import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Modal, Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useWorkerProfile, useUpdateWorkerProfile } from "@/lib/queries/worker";
import { useTheme, useColors } from "@/lib/theme";
import { api } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatDate } from "@/lib/utils";

export default function WorkerProfile() {
  const Colors = useColors();
  const { isDark, toggleTheme }                 = useTheme();
  const { logout }                              = useAuth();
  const { data, isLoading, refetch, isRefetching } = useWorkerProfile();
  const { mutate: save, isPending: saving }     = useUpdateWorkerProfile();

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [editing, setEditing] = useState(false);
  const [pwdModal,    setPwdModal]     = useState(false);
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.user.name);
    setPhone(data.user.phone ?? "");
  }, [data]);

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 120 },

    avatarSection: { paddingTop: 36, paddingBottom: 28, alignItems: "center" },
    avatarRing:    { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
    avatarText:    { fontSize: 30, fontWeight: "800", color: Colors.white },
    userName:      { fontSize: 20, fontWeight: "800", color: Colors.white, marginBottom: 8 },
    rolePill:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", marginBottom: 6 },
    roleText:      { fontSize: 12, fontWeight: "600", color: Colors.primaryMid },
    since:         { fontSize: 12, color: "rgba(255,255,255,0.55)" },

    statsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 14, gap: 10 },
    statBox:  { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderTopWidth: 3, alignItems: "center", borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statValue:{ fontSize: 26, fontWeight: "800" },
    statLabel:{ fontSize: 12, color: Colors.textMuted, marginTop: 3, textAlign: "center" },

    card:          { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    cardHeaderLeft:{ flexDirection: "row", alignItems: "center", gap: 6 },
    cardLabel:     { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    editBtn:       { flexDirection: "row", alignItems: "center", gap: 4 },
    editLink:      { fontSize: 13, fontWeight: "600", color: Colors.primary },
    cancelEditBtn: {},
    cancelLink:    { fontSize: 13, fontWeight: "600", color: Colors.error },

    facilityName:   { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    facilityLocRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
    facilityCity:   { fontSize: 12, color: Colors.textMuted },
    tagRow:         { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tag:            { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    tagText:        { fontSize: 11, fontWeight: "600", color: Colors.primaryDark },

    infoRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    infoIconBox:   { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", marginRight: 10 },
    infoBody:      { flex: 1 },
    infoLabel:     { fontSize: 11, color: Colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
    infoValue:     { fontSize: 15, fontWeight: "600", color: Colors.text },

    field:          { marginBottom: 12 },
    fieldLabel:     { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:      { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: Colors.card },
    inputIcon:      { marginRight: 8 },
    fieldInput:     { flex: 1, fontSize: 15, color: Colors.text },

    saveBtn:        { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 },
    saveBtnDisabled:{ opacity: 0.6 },
    saveBtnText:    { fontSize: 15, fontWeight: "700", color: Colors.white },

    logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 16, borderWidth: 1.5, borderColor: Colors.error + "60", borderRadius: 14, paddingVertical: 14, backgroundColor: Colors.errorLight },
    logoutText: { fontSize: 15, fontWeight: "700", color: Colors.error },

    secRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
    secLeft:    { flexDirection: "row", alignItems: "center", gap: 12 },
    secLabel:   { fontSize: 15, fontWeight: "600", color: Colors.text },
    secSub:     { fontSize: 12, marginTop: 1, color: Colors.textMuted },

    pwdOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    pwdSheet:   { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    pwdHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    pwdTitle:   { fontSize: 18, fontWeight: "800", color: Colors.text, marginBottom: 20 },
    pwdField:   { marginBottom: 14 },
    pwdLabel:   { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    pwdInputWrap:{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48 },
    pwdInput:   { flex: 1, fontSize: 15, color: Colors.text },
    pwdActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    pwdCancel:  { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    pwdCancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    pwdSave:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: Colors.primary },
    pwdSaveText:{ fontSize: 15, fontWeight: "700", color: Colors.white },

    prefRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
    prefLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
    prefLabel:  { fontSize: 15, fontWeight: "600", color: Colors.text },
    prefSub:    { fontSize: 12, marginTop: 1, color: Colors.textMuted },
  });

  if (isLoading) return <LoadingScreen />;

  const profile  = data!;
  const facility = profile.facility;

  const initials = profile.user.name
    ? profile.user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) return Alert.alert("Required", "All fields are required.");
    if (newPwd.length < 8) return Alert.alert("Validation", "New password must be at least 8 characters.");
    if (newPwd !== confirmPwd) return Alert.alert("Validation", "New passwords do not match.");
    setPwdLoading(true);
    try {
      await api.put("/api/ground-owner/force-change-password", { currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd });
      setPwdModal(false);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      Alert.alert("Success", "Password changed successfully.");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  }

  function handleSave() {
    if (!name.trim() || name.trim().length < 2) {
      return Alert.alert("Validation", "Name must be at least 2 characters.");
    }
    save(
      { name: name.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: () => { setEditing(false); Alert.alert("Saved", "Profile updated."); },
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
      <View style={s.infoRow}>
        <View style={s.infoIconBox}>
          <Ionicons name={icon as never} size={16} color={Colors.textMuted} />
        </View>
        <View style={s.infoBody}>
          <Text style={s.infoLabel}>{label}</Text>
          <Text style={s.infoValue}>{value}</Text>
        </View>
      </View>
    );
  }

  function Field({ label, value, onChangeText, placeholder, keyboardType, icon }: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; keyboardType?: "default" | "phone-pad"; icon?: string;
  }) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
          {icon && (
            <Ionicons
              name={icon as never}
              size={16}
              color={focused ? Colors.primary : Colors.textMuted}
              style={s.inputIcon}
            />
          )}
          <TextInput
            style={s.fieldInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType ?? "default"}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Gradient avatar section */}
        <LinearGradient
          colors={[Colors.navy, Colors.navyDark]}
          style={s.avatarSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.avatarRing}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userName}>{profile.user.name}</Text>
          <View style={s.rolePill}>
            <Ionicons name="construct-outline" size={12} color={Colors.primaryMid} />
            <Text style={s.roleText}>Ground Worker</Text>
          </View>
          {profile.workerSince && (
            <Text style={s.since}>Since {formatDate(profile.workerSince)}</Text>
          )}
        </LinearGradient>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { borderTopColor: Colors.primary }]}>
            <Text style={[s.statValue, { color: Colors.primary }]}>{profile.stats.walkins}</Text>
            <Text style={s.statLabel}>Walk-ins Created</Text>
          </View>
        </View>

        {/* Facility card */}
        {facility && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
              <Text style={s.cardLabel}>MY FACILITY</Text>
            </View>
            <Text style={s.facilityName}>{facility.name}</Text>
            <View style={s.facilityLocRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.facilityCity}>{facility.city} · {facility.address}</Text>
            </View>
            <View style={s.tagRow}>
              {facility.categories.slice(0, 3).map((c: { name: string; icon?: string | null }) => (
                <View key={c.name} style={s.tag}>
                  <Text style={s.tagText}>{c.icon ? `${c.icon} ` : ""}{c.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile fields */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <Text style={s.cardLabel}>PERSONAL INFO</Text>
            </View>
            {!editing ? (
              <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                <Text style={s.editLink}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.cancelEditBtn}
                onPress={() => {
                  setEditing(false);
                  setName(profile.user.name);
                  setPhone(profile.user.phone ?? "");
                }}
              >
                <Text style={s.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <Field label="NAME *"  value={name}  onChangeText={setName}  placeholder="Your full name"  icon="person-outline" />
              <Field label="PHONE"   value={phone} onChangeText={setPhone} placeholder="077 123 4567"   icon="call-outline"   keyboardType="phone-pad" />
              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <InfoRow icon="person-outline" label="Name"  value={profile.user.name} />
              <InfoRow icon="mail-outline"   label="Email" value={profile.user.email} />
              <InfoRow icon="call-outline"   label="Phone" value={profile.user.phone ?? "—"} />
            </>
          )}
        </View>

        {/* Preferences */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Ionicons name="settings-outline" size={14} color={Colors.textMuted} />
              <Text style={s.cardLabel}>PREFERENCES</Text>
            </View>
          </View>
          <View style={s.prefRow}>
            <View style={s.prefLeft}>
              <Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color={isDark ? "#818cf8" : "#d97706"} />
              <View>
                <Text style={s.prefLabel}>Dark Mode</Text>
                <Text style={s.prefSub}>{isDark ? "Enabled" : "System default"}</Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.white} />
          </View>
        </View>

        {/* Security */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Ionicons name="shield-outline" size={14} color={Colors.textMuted} />
              <Text style={s.cardLabel}>SECURITY</Text>
            </View>
          </View>
          <TouchableOpacity style={s.secRow} onPress={() => setPwdModal(true)} activeOpacity={0.7}>
            <View style={s.secLeft}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={s.secLabel}>Change Password</Text>
                <Text style={s.secSub}>Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={pwdModal} transparent animationType="slide" onRequestClose={() => setPwdModal(false)}>
        <View style={s.pwdOverlay}>
          <View style={s.pwdSheet}>
            <View style={s.pwdHandle} />
            <Text style={s.pwdTitle}>Change Password</Text>

            {(["Current Password", "New Password", "Confirm New Password"] as const).map((label, i) => {
              const val     = [currentPwd, newPwd, confirmPwd][i];
              const set     = [setCurrentPwd, setNewPwd, setConfirmPwd][i];
              const show    = [showCurrent, showNew, showConfirm][i];
              const setShow = [setShowCurrent, setShowNew, setShowConfirm][i];
              return (
                <View key={label} style={s.pwdField}>
                  <Text style={s.pwdLabel}>{label}</Text>
                  <View style={s.pwdInputWrap}>
                    <TextInput
                      style={s.pwdInput}
                      value={val}
                      onChangeText={set}
                      secureTextEntry={!show}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      returnKeyType={i === 2 ? "done" : "next"}
                      onSubmitEditing={i === 2 ? handleChangePassword : undefined}
                      editable={!pwdLoading}
                    />
                    <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={8}>
                      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={s.pwdActions}>
              <TouchableOpacity style={s.pwdCancel} onPress={() => { setPwdModal(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }}>
                <Text style={s.pwdCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.pwdSave, pwdLoading && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={pwdLoading}>
                {pwdLoading ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.pwdSaveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
