import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useWorkerProfile, useUpdateWorkerProfile } from "@/lib/queries/worker";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatDate } from "@/lib/utils";

export default function WorkerProfile() {
  const Colors = useColors();
  const { logout }                              = useAuth();
  const { data, isLoading, refetch, isRefetching } = useWorkerProfile();
  const { mutate: save, isPending: saving }     = useUpdateWorkerProfile();

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.user.name);
    setPhone(data.user.phone ?? "");
  }, [data]);

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 48 },

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
  });

  if (isLoading) return <LoadingScreen />;

  const profile  = data!;
  const facility = profile.facility;

  const initials = profile.user.name
    ? profile.user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

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

        {/* Sign out */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
