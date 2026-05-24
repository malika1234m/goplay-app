import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useTheme, useColors } from "@/lib/theme";

export default function OwnerProfile() {
  const { user, logout }     = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const Colors               = useColors();

  const bg     = Colors.background;
  const cardBg = Colors.card;
  const txt    = Colors.text;
  const muted  = Colors.textMuted;
  const border = Colors.border;

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Gradient avatar section */}
        <LinearGradient colors={[Colors.navy, Colors.navyDark]} style={s.avatarSection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.avatarRing}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userName}>{user?.name}</Text>
          <View style={s.rolePill}>
            <Ionicons name="shield-checkmark-outline" size={12} color={Colors.primaryMid} />
            <Text style={s.roleText}>Ground Owner</Text>
          </View>
        </LinearGradient>

        {/* Account info card */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.cardHeader}>
            <Ionicons name="person-outline" size={14} color={muted} />
            <Text style={[s.cardLabel, { color: muted }]}>ACCOUNT DETAILS</Text>
          </View>
          <InfoRow icon="person-outline"      label="Full Name" value={user?.name ?? "—"}    muted={muted} txt={txt} bg={bg} border={border} />
          <InfoRow icon="mail-outline"         label="Email"     value={user?.email ?? "—"}   muted={muted} txt={txt} bg={bg} border={border} />
          <InfoRow icon="shield-outline"       label="Role"      value="Ground Owner"          muted={muted} txt={txt} bg={bg} border={border} />
        </View>

        {/* Preferences card */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.cardHeader}>
            <Ionicons name="settings-outline" size={14} color={muted} />
            <Text style={[s.cardLabel, { color: muted }]}>PREFERENCES</Text>
          </View>
          <View style={s.prefRow}>
            <View style={s.prefLeft}>
              <Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color={isDark ? "#818cf8" : "#d97706"} style={s.prefIcon} />
              <View>
                <Text style={[s.prefLabel, { color: txt }]}>Dark Mode</Text>
                <Text style={[s.prefSub, { color: muted }]}>{isDark ? "Enabled" : "System default"}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[s.logoutBtnBase, { borderColor: Colors.error + "60", backgroundColor: Colors.errorLight }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={[s.logoutText, { color: Colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, muted, txt, bg, border }: {
  icon: string; label: string; value: string; muted: string; txt: string; bg: string; border: string;
}) {
  return (
    <View style={[s.infoRow, { borderBottomColor: border }]}>
      <View style={[s.infoIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon as never} size={16} color={muted} />
      </View>
      <View style={s.infoBody}>
        <Text style={[s.infoLabel, { color: muted }]}>{label}</Text>
        <Text style={[s.infoValue, { color: txt }]}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48 },
  avatarSection: { paddingTop: 40, paddingBottom: 32, alignItems: "center" },
  avatarRing:    { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarText:    { fontSize: 32, fontWeight: "800", color: "#ffffff" },
  userName:      { fontSize: 22, fontWeight: "800", color: "#ffffff", marginBottom: 8 },
  rolePill:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  roleText:      { fontSize: 12, fontWeight: "600", color: "#bbf7d0" },
  card:          { borderRadius: 16, marginHorizontal: 16, marginTop: 16, padding: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  cardLabel:     { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  infoRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  infoIconBox:   { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoBody:      { flex: 1 },
  infoLabel:     { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  infoValue:     { fontSize: 15, fontWeight: "600" },
  prefRow:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  prefLeft:      { flexDirection: "row", alignItems: "center", gap: 0 },
  prefIcon:      { marginRight: 12 },
  prefLabel:     { fontSize: 15, fontWeight: "600" },
  prefSub:       { fontSize: 12, marginTop: 1 },
  logoutBtnBase: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 16, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  logoutText:    { fontSize: 15, fontWeight: "700" },
});
