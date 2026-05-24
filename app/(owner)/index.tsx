import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity,
  Animated, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth";
import { useOwnerStats } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatLKR } from "@/lib/utils";
import type { TodayBooking } from "@/types";

const GOAL_KEY = "revenue_goal";

function useCountUp(target: number, duration = 1200) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!target) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(listener);
  }, [target]);

  return display;
}

export default function OwnerDashboard() {
  const Colors = useColors();
  const { user } = useAuth();
  const router   = useRouter();
  const { data, isLoading, refetch, isRefetching } = useOwnerStats();

  const STATUS_BAR_COLOR: Record<string, string> = {
    PENDING:   Colors.warning,
    CONFIRMED: Colors.primary,
    COMPLETED: Colors.info,
    CANCELLED: Colors.error,
    NO_SHOW:   Colors.accent,
  };

  const stats = data?.stats;
  const today = data?.todayBookings ?? [];

  const [goal, setGoal]           = useState(0);
  const [editGoal, setEditGoal]   = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const animRevenue  = useCountUp(stats?.monthlyRevenue ?? 0);
  const animBookings = useCountUp(stats?.totalBookings ?? 0);

  const now  = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const progress = goal > 0 ? Math.min((stats?.monthlyRevenue ?? 0) / goal, 1) : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress]);

  function saveGoal() {
    const val = parseInt(goalInput.replace(/[^0-9]/g, ""), 10);
    if (!val || val < 1000) {
      Alert.alert("Invalid", "Enter a goal of at least LKR 1,000");
      return;
    }
    setGoal(val);
    setEditGoal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: Colors.background },
    header:     { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    headerTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
    greeting:   { fontSize: 22, fontWeight: "800", color: Colors.white, letterSpacing: -0.3 },
    date:       { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 },
    avatarBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 17, fontWeight: "700", color: Colors.white },
    revenueCard:     { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    revenueLeft:     { flex: 1 },
    revenueLabel:    { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
    revenueValue:    { fontSize: 28, fontWeight: "900", color: Colors.white, letterSpacing: -0.5 },
    revenueChip:     { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, backgroundColor: Colors.white, borderRadius: 20, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3 },
    revenueChipText: { fontSize: 11, color: Colors.primaryDark, fontWeight: "600" },
    revenueRight:    { flexDirection: "row", gap: 0, marginLeft: 16 },
    revenueStatMini: { alignItems: "center", paddingHorizontal: 14 },
    revMiniBorder:   { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.2)" },
    revMiniVal:      { fontSize: 18, fontWeight: "800", color: Colors.white },
    revMiniLabel:    { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },
    goalRow:     { marginTop: 14, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12 },
    goalInfo:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    goalLabel:   { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
    goalPct:     { fontSize: 12, color: Colors.primaryMid, fontWeight: "700" },
    goalTrack:   { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
    goalFill:    { height: "100%", borderRadius: 3, backgroundColor: Colors.primaryMid },
    goalEdit:    { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 },
    goalInput:   { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: Colors.white, fontSize: 14, fontWeight: "600" },
    goalSaveBtn: { backgroundColor: Colors.primaryMid, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    goalSaveTxt: { fontSize: 13, fontWeight: "700", color: Colors.primaryDeep },
    goalCancelBtn:{ padding: 6 },
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    quickRow:     { flexDirection: "row", gap: 10, marginBottom: 24 },
    quickBtn:     { flex: 1, alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
    quickIconWrap:{ width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 6 },
    quickLabel:   { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
    section:    { flex: 1 },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    sectionTitle:{ fontSize: 17, fontWeight: "800", color: Colors.text },
    seeAllBtn:  { flexDirection: "row", alignItems: "center", gap: 2 },
    seeAllText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
    emptyBox:      { alignItems: "center", paddingVertical: 36, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
    emptyIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    emptyTitle:    { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    emptyText:     { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
    emptyAction:   { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    emptyActionText:{ fontSize: 13, fontWeight: "700", color: Colors.white },
    todayCard:     { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: Colors.border },
    todayCardLast: { marginBottom: 0 },
    timeCol:       { width: 46, alignItems: "center", marginRight: 14 },
    timeStart:     { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    timeLine:      { flex: 1, width: 2, borderRadius: 1, marginVertical: 4, overflow: "hidden", minHeight: 12 },
    timeLineFill:  { width: "100%", height: "60%", borderRadius: 1 },
    timeEnd:       { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    todayContent:  { flex: 1, borderLeftWidth: 3, paddingLeft: 12, borderRadius: 2 },
    todayRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
    todayPlayer:   { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1, marginRight: 8 },
    todayFacility: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
    todayBottom:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    todayAmount:   { fontSize: 14, fontWeight: "800", color: Colors.primary },
    paymentPill:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.surfaceAlt, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    paymentText:   { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Gradient header */}
      <LinearGradient colors={[Colors.navy, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Good {getTimeOfDay()}, {user?.name?.split(" ")[0]}</Text>
            <Text style={s.date}>{date}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push("/(owner)/profile")}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue card */}
        <View style={s.revenueCard}>
          <View style={s.revenueLeft}>
            <Text style={s.revenueLabel}>Monthly Revenue</Text>
            <Text style={s.revenueValue}>
              {isLoading ? "—" : `LKR ${animRevenue.toLocaleString()}`}
            </Text>
            <View style={s.revenueChip}>
              <Ionicons name="business-outline" size={11} color={Colors.primary} />
              <Text style={s.revenueChipText}>
                {stats?.activeGrounds ?? 0}/{stats?.totalGrounds ?? 0} active grounds
              </Text>
            </View>
          </View>
          <View style={s.revenueRight}>
            <View style={s.revenueStatMini}>
              <Text style={s.revMiniVal}>{isLoading ? "—" : String(animBookings)}</Text>
              <Text style={s.revMiniLabel}>Bookings</Text>
            </View>
            <View style={[s.revenueStatMini, s.revMiniBorder]}>
              <Text style={s.revMiniVal}>{isLoading ? "—" : stats?.avgRating ? String(stats.avgRating) : "—"}</Text>
              <Text style={s.revMiniLabel}>Avg Rating</Text>
            </View>
          </View>
        </View>

        {/* Revenue goal progress */}
        {!editGoal ? (
          <TouchableOpacity style={s.goalRow} onPress={() => { setGoalInput(String(goal || "")); setEditGoal(true); }} activeOpacity={0.8}>
            <View style={s.goalInfo}>
              <Text style={s.goalLabel}>
                {goal > 0 ? `Goal: LKR ${goal.toLocaleString()}` : "Set a monthly revenue goal"}
              </Text>
              {goal > 0 && (
                <Text style={s.goalPct}>{Math.round(progress * 100)}%</Text>
              )}
            </View>
            {goal > 0 && (
              <View style={s.goalTrack}>
                <Animated.View style={[s.goalFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={s.goalEdit}>
            <TextInput
              style={s.goalInput}
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="e.g. 100000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity style={s.goalSaveBtn} onPress={saveGoal}>
              <Text style={s.goalSaveTxt}>Set</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.goalCancelBtn} onPress={() => setEditGoal(false)}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Scrollable body */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Quick actions */}
        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(owner)/bookings")} activeOpacity={0.75}>
            <View style={s.quickIconWrap}><Ionicons name="calendar-outline" size={20} color={Colors.primary} /></View>
            <Text style={s.quickLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(owner)/grounds")} activeOpacity={0.75}>
            <View style={s.quickIconWrap}><Ionicons name="business-outline" size={20} color={Colors.primary} /></View>
            <Text style={s.quickLabel}>Grounds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(owner)/earnings")} activeOpacity={0.75}>
            <View style={s.quickIconWrap}><Ionicons name="cash-outline" size={20} color={Colors.primary} /></View>
            <Text style={s.quickLabel}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(owner)/reviews")} activeOpacity={0.75}>
            <View style={s.quickIconWrap}><Ionicons name="star-outline" size={20} color={Colors.primary} /></View>
            <Text style={s.quickLabel}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Today's bookings */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push("/(owner)/bookings")}>
              <Text style={s.seeAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <SkeletonList count={3} />
          ) : today.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>All clear today</Text>
              <Text style={s.emptyText}>No bookings scheduled for today</Text>
              <TouchableOpacity style={s.emptyAction} onPress={() => router.push("/(owner)/grounds")}>
                <Text style={s.emptyActionText}>Manage Grounds</Text>
              </TouchableOpacity>
            </View>
          ) : (
            today.map((b, i) => {
              const barColor = STATUS_BAR_COLOR[b.status] ?? Colors.primary;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[s.todayCard, i === today.length - 1 && s.todayCardLast]}
                  onPress={() => router.push(`/(owner)/bookings/${b.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={s.timeCol}>
                    <Text style={s.timeStart}>{b.startTime}</Text>
                    <View style={[s.timeLine, { backgroundColor: barColor + "40" }]}>
                      <View style={[s.timeLineFill, { backgroundColor: barColor }]} />
                    </View>
                    <Text style={s.timeEnd}>{b.endTime}</Text>
                  </View>
                  <View style={[s.todayContent, { borderLeftColor: barColor }]}>
                    <View style={s.todayRow}>
                      <Text style={s.todayPlayer} numberOfLines={1}>{b.userName}</Text>
                      <Badge status={b.status} small />
                    </View>
                    <Text style={s.todayFacility} numberOfLines={1}>
                      {b.facilityName}{b.courtName ? ` · ${b.courtName}` : ""}
                    </Text>
                    <View style={s.todayBottom}>
                      <Text style={s.todayAmount}>{formatLKR(b.totalAmount)}</Text>
                      <View style={s.paymentPill}>
                        <Ionicons name={b.paymentMethod === "ONLINE" ? "card-outline" : "cash-outline"} size={11} color={Colors.textMuted} />
                        <Text style={s.paymentText}>{b.paymentMethod === "ONLINE" ? "Online" : "Cash"}</Text>
                      </View>
                    </View>
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

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
