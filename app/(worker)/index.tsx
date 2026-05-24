import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth";
import { useWorkerBookings, useWorkerFacility } from "@/lib/queries/worker";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import { formatLKR, isoDate } from "@/lib/utils";
import type { WorkerBooking } from "@/types";

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export default function WorkerDashboard() {
  const Colors = useColors();
  const { user } = useAuth();
  const router   = useRouter();
  const today    = isoDate(new Date());

  const { data: facilityData, refetch: refetchFacility }              = useWorkerFacility();
  const { data: bookingData, isRefetching, refetch: refetchBookings } = useWorkerBookings({ date: today });

  const STATUS_BAR_COLOR: Record<string, string> = {
    PENDING:   Colors.warning,
    CONFIRMED: Colors.primary,
    COMPLETED: Colors.info,
    CANCELLED: Colors.error,
    NO_SHOW:   Colors.accent,
  };

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },

    header:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
    greeting:  { fontSize: 22, fontWeight: "800", color: Colors.white, letterSpacing: -0.3 },
    date:      { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 },
    avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
    avatarText:{ fontSize: 17, fontWeight: "700", color: Colors.white },

    statsRow: { flexDirection: "row", gap: 10 },
    statPill: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 12, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    statPillVal:  { fontSize: 20, fontWeight: "800", color: Colors.white },
    statPillLabel:{ fontSize: 10, color: "rgba(255,255,255,0.65)" },

    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

    facilityCard:   { backgroundColor: Colors.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
    facilityHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    facilityIconWrap:{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.infoLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
    facilityTextWrap:{ flex: 1 },
    facilityName:   { fontSize: 15, fontWeight: "700", color: Colors.text },
    facilityAddr:   { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    facilityRatePill:{ backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    facilityRate:   { fontSize: 12, fontWeight: "700", color: Colors.primary },
    facilityTags:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tag:            { backgroundColor: Colors.surfaceAlt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
    tagText:        { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },

    walkInBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 24 },
    walkInLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    walkInText: { fontSize: 15, fontWeight: "700", color: Colors.white },

    section:    { flex: 1 },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    sectionTitle:{ fontSize: 17, fontWeight: "800", color: Colors.text },
    seeAllBtn:  { flexDirection: "row", alignItems: "center", gap: 2 },
    seeAllText: { fontSize: 13, color: Colors.info, fontWeight: "600" },

    emptyBox:     { alignItems: "center", paddingVertical: 36, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
    emptyIconWrap:{ width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.infoLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    emptyTitle:   { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    emptyText:    { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
    emptyAction:  { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    emptyActionText:{ fontSize: 13, fontWeight: "700", color: Colors.white },

    card:          { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: Colors.border },
    cardLast:      { marginBottom: 0 },
    cardTimeCol:   { width: 44, alignItems: "center", marginRight: 14 },
    cardTimeStart: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    cardTimeLine:  { flex: 1, width: 2, borderRadius: 1, marginVertical: 4, overflow: "hidden", minHeight: 12 },
    cardTimeLineFill:{ width: "100%", height: "60%", borderRadius: 1 },
    cardTimeEnd:   { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    cardBody:      { flex: 1, borderLeftWidth: 3, paddingLeft: 12 },
    cardRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
    cardPlayer:    { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1, marginRight: 8 },
    cardCourt:     { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
    cardAmount:    { fontSize: 14, fontWeight: "800", color: Colors.primary },
  });

  const facility      = facilityData?.facility;
  const todayBookings = bookingData?.bookings ?? [];
  const confirmed     = todayBookings.filter(b => b.status === "CONFIRMED").length;
  const pending       = todayBookings.filter(b => b.status === "PENDING").length;

  const now  = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  function refetch() { refetchFacility(); refetchBookings(); }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Gradient header */}
      <LinearGradient colors={[Colors.info, "#0369a1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Good {getTimeOfDay()}, {user?.name?.split(" ")[0]}</Text>
            <Text style={s.date}>{date}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push("/(worker)/profile")}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Today stat row */}
        <View style={s.statsRow}>
          <View style={s.statPill}>
            <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={s.statPillVal}>{String(todayBookings.length)}</Text>
            <Text style={s.statPillLabel}>Today</Text>
          </View>
          <View style={s.statPill}>
            <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={s.statPillVal}>{String(confirmed)}</Text>
            <Text style={s.statPillLabel}>Confirmed</Text>
          </View>
          <View style={s.statPill}>
            <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={s.statPillVal}>{String(pending)}</Text>
            <Text style={s.statPillLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.info} />}
      >
        {/* Facility card */}
        {facility && (
          <View style={s.facilityCard}>
            <View style={s.facilityHeader}>
              <View style={s.facilityIconWrap}>
                <Ionicons name="business" size={20} color={Colors.info} />
              </View>
              <View style={s.facilityTextWrap}>
                <Text style={s.facilityName}>{facility.name}</Text>
                <Text style={s.facilityAddr}>{facility.city}</Text>
              </View>
              <View style={s.facilityRatePill}>
                <Text style={s.facilityRate}>{formatLKR(facility.hourlyRate)}/hr</Text>
              </View>
            </View>
            <View style={s.facilityTags}>
              {facility.categories.slice(0, 3).map(c => (
                <View key={c} style={s.tag}><Text style={s.tagText}>{c}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Walk-in CTA */}
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(worker)/bookings"); }} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.walkInBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={s.walkInLeft}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.white} />
              <Text style={s.walkInText}>Create Walk-in Booking</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Today's bookings */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push("/(worker)/schedule")}>
              <Text style={s.seeAllText}>Schedule</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.info} />
            </TouchableOpacity>
          </View>

          {todayBookings.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={28} color={Colors.info} />
              </View>
              <Text style={s.emptyTitle}>All clear today</Text>
              <Text style={s.emptyText}>No bookings scheduled</Text>
              <TouchableOpacity style={s.emptyAction} onPress={() => router.push("/(worker)/bookings")}>
                <Text style={s.emptyActionText}>Create Walk-in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayBookings.map((b, i) => {
              const barColor = STATUS_BAR_COLOR[b.status] ?? Colors.info;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[s.card, i === todayBookings.length - 1 && s.cardLast]}
                  onPress={() => router.push(`/(worker)/bookings/${b.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={s.cardTimeCol}>
                    <Text style={s.cardTimeStart}>{b.startTime}</Text>
                    <View style={[s.cardTimeLine, { backgroundColor: barColor + "30" }]}>
                      <View style={[s.cardTimeLineFill, { backgroundColor: barColor }]} />
                    </View>
                    <Text style={s.cardTimeEnd}>{b.endTime}</Text>
                  </View>
                  <View style={[s.cardBody, { borderLeftColor: barColor }]}>
                    <View style={s.cardRow}>
                      <Text style={s.cardPlayer} numberOfLines={1}>{b.playerName}</Text>
                      <Badge status={b.status} small />
                    </View>
                    {b.courtName && <Text style={s.cardCourt}>{b.courtName}</Text>}
                    <Text style={s.cardAmount}>{formatLKR(b.totalAmount)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
