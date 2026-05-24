import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEarnings, useEarningsTrends, type EarningsRange } from "@/lib/queries/earnings";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatLKR } from "@/lib/utils";

const RANGES: { key: EarningsRange; label: string }[] = [
  { key: "month", label: "This Month" },
  { key: "30d",   label: "30 Days"    },
  { key: "90d",   label: "90 Days"    },
  { key: "all",   label: "All Time"   },
];

const CHART_H = 100;

export default function EarningsScreen() {
  const Colors = useColors();
  const router = useRouter();
  const [range,      setRange]      = useState<EarningsRange>("month");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tie chart window to the selected range
  const trendDays: 7 | 30 | 90 = range === "90d" || range === "all" ? 90 : 30;

  const { data, isLoading, refetch, isRefetching } = useEarnings(range);
  const { data: trendData } = useEarningsTrends(trendDays);

  if (isLoading) return <LoadingScreen />;

  const s_     = data?.summary;
  const facs   = data?.byFacility ?? [];
  const trends = trendData?.trends;
  const hasChart = trends?.revenue.some((v) => v > 0) ?? false;

  const FAC_COLORS = [Colors.primary, "#0891b2", "#8b5cf6", "#f59e0b", "#ef4444"];

  const s = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 40 },

    rangeRow:       { flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" },
    chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
    chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText:       { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    chipTextActive: { color: Colors.white },

    // Hero
    hero:          { borderRadius: 20, padding: 22, marginBottom: 14 },
    heroLabel:     { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    heroAmount:    { fontSize: 40, fontWeight: "900", color: Colors.white, letterSpacing: -1, marginBottom: 20 },
    heroStats:     { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 14, padding: 14 },
    heroStat:      { flex: 1, alignItems: "center" },
    heroStatVal:   { fontSize: 14, fontWeight: "700", color: Colors.white },
    heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: "500" },
    heroStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
    cashNote:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
    cashNoteText:  { fontSize: 12, color: "#fbbf24", fontWeight: "500" },

    // Chart
    chartCard:   { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
    chartTitle:  { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 14 },
    chartXLabel: { fontSize: 9, color: Colors.textMuted, textAlign: "center" },

    // Payout shortcut
    payoutCard:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: Colors.primaryMid },
    payoutLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
    payoutIcon:  { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
    payoutTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
    payoutSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

    // Facility section
    section:      { gap: 8 },
    sectionLabel: { fontSize: 12, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
    facCard:      { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
    facRow:       { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    facLeft:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
    facIndex:     { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    facIndexText: { fontSize: 16, fontWeight: "800" },
    facInfo:      { flex: 1, minWidth: 0 },
    facName:      { fontSize: 14, fontWeight: "700", color: Colors.text },
    facMeta:      { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    facRight:     { alignItems: "flex-end" },
    facNet:       { fontSize: 16, fontWeight: "800", color: Colors.primary },
    facPct:       { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    barBg:        { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
    barFill:      { height: 4, borderRadius: 2 },

    // Accordion booking list
    bookingList:       { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 10 },
    bookingListHeader: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.background },
    col1:              { flex: 1, minWidth: 0 },
    colAmt:            { width: 58, textAlign: "right" },
    colHead:           { fontSize: 10, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase" },
    bookingRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: Colors.background },
    playerRow:         { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
    playerName:        { fontSize: 13, fontWeight: "600", color: Colors.text, flexShrink: 1 },
    bookingMeta:       { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    amtGross:          { fontSize: 12, color: Colors.textSecondary },
    amtFee:            { fontSize: 12, color: "#f87171" },
    amtNone:           { fontSize: 12, color: Colors.textMuted },
    amtNet:            { fontSize: 13, fontWeight: "700", color: Colors.primary },
    badge:             { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
    badgeText:         { fontSize: 10, fontWeight: "700" },
    walkInBadge:       { backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
    walkInBadgeText:   { fontSize: 10, fontWeight: "700", color: "#6d28d9" },
    facFooter:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
    footerLabel:       { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    footerGross:       { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, textAlign: "right" },
    footerFee:         { fontSize: 12, fontWeight: "600", color: "#f87171", textAlign: "right" },
    footerNet:         { fontSize: 13, fontWeight: "800", color: Colors.primary, textAlign: "right" },
  });

  function PayBadge({ method, confirmed }: { method: string; confirmed: boolean }) {
    if (method === "ONLINE")
      return <View style={[s.badge, { backgroundColor: "#dbeafe" }]}><Text style={[s.badgeText, { color: "#1d4ed8" }]}>Card</Text></View>;
    if (confirmed)
      return <View style={[s.badge, { backgroundColor: "#dcfce7" }]}><Text style={[s.badgeText, { color: "#14532d" }]}>Cash ✓</Text></View>;
    return <View style={[s.badge, { backgroundColor: "#fef3c7" }]}><Text style={[s.badgeText, { color: "#92400e" }]}>Pending</Text></View>;
  }

  function EarningsChart({ labels, revenue }: { labels: string[]; revenue: number[] }) {
    const max  = Math.max(...revenue, 1);
    const step = Math.max(1, Math.ceil(labels.length / 6));
    return (
      <View>
        <View style={{ height: CHART_H, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
          {revenue.map((val, i) => (
            <View key={i} style={{ flex: 1, height: CHART_H, justifyContent: "flex-end" }}>
              <View style={{
                height:          Math.max(3, Math.round((val / max) * CHART_H)),
                backgroundColor: Colors.primary,
                borderRadius:    3,
                opacity:         val === 0 ? 0.12 : 0.85,
              }} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          {labels.map((label, i) => (
            <View key={i} style={{ flex: 1 }}>
              {i % step === 0 && (
                <Text style={s.chartXLabel} numberOfLines={1}>{label}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
      }
    >
      {/* ── Range pills ── */}
      <View style={s.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[s.chip, range === r.key && s.chipActive]}
            onPress={() => setRange(r.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, range === r.key && s.chipTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Hero earnings card ── */}
      <LinearGradient
        colors={[Colors.primary, "#15803d"]}
        style={s.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={s.heroLabel}>Net Earnings</Text>
        <Text style={s.heroAmount}>{formatLKR(s_?.totalNet ?? 0)}</Text>

        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>{formatLKR(s_?.totalGross ?? 0)}</Text>
            <Text style={s.heroStatLabel}>Gross</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>−{formatLKR(s_?.totalFee ?? 0)}</Text>
            <Text style={s.heroStatLabel}>Platform fee</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>{s_?.totalCount ?? 0}</Text>
            <Text style={s.heroStatLabel}>Sessions</Text>
          </View>
        </View>

        {(s_?.cashPending ?? 0) > 0 && (
          <View style={s.cashNote}>
            <Ionicons name="warning-outline" size={13} color="#fbbf24" />
            <Text style={s.cashNoteText}>
              {s_!.cashPending} cash booking{s_!.cashPending > 1 ? "s" : ""} pending confirmation
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Trend chart ── */}
      {hasChart && (
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Net Earnings — last {trendDays} days</Text>
          <EarningsChart labels={trends!.labels} revenue={trends!.revenue} />
        </View>
      )}

      {/* ── Payout shortcut ── */}
      <TouchableOpacity
        style={s.payoutCard}
        onPress={() => router.push("/(owner)/earnings/payouts")}
        activeOpacity={0.8}
      >
        <View style={s.payoutLeft}>
          <View style={s.payoutIcon}>
            <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={s.payoutTitle}>Payout Centre</Text>
            <Text style={s.payoutSub}>Balance · request payment · history</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
      </TouchableOpacity>

      {/* ── Facility breakdown ── */}
      {facs.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>By facility</Text>
          {facs.map((f, i) => {
            const pct      = (s_?.totalNet ?? 0) > 0 ? Math.round((f.net / s_!.totalNet) * 100) : 0;
            const color    = FAC_COLORS[i % FAC_COLORS.length];
            const expanded = expandedId === f.facilityId;
            return (
              <View key={f.facilityId} style={s.facCard}>
                <TouchableOpacity
                  style={s.facRow}
                  onPress={() => setExpandedId(expanded ? null : f.facilityId)}
                  activeOpacity={0.75}
                >
                  <View style={s.facLeft}>
                    <View style={[s.facIndex, { backgroundColor: color + "22" }]}>
                      <Text style={[s.facIndexText, { color }]}>
                        {f.facilityName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.facInfo}>
                      <Text style={s.facName} numberOfLines={1}>{f.facilityName}</Text>
                      <Text style={s.facMeta}>{f.facilityCity} · {f.count} session{f.count !== 1 ? "s" : ""}</Text>
                    </View>
                  </View>
                  <View style={s.facRight}>
                    <Text style={s.facNet}>{formatLKR(f.net)}</Text>
                    <Text style={s.facPct}>{pct}% of total</Text>
                  </View>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.textMuted}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                <View style={[s.barBg, { marginHorizontal: 14, marginBottom: expanded ? 0 : 14 }]}>
                  <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                </View>

                {expanded && (
                  <View style={s.bookingList}>
                    <View style={s.bookingListHeader}>
                      <Text style={[s.col1, s.colHead]}>Booking</Text>
                      <Text style={[s.colAmt, s.colHead]}>Gross</Text>
                      <Text style={[s.colAmt, s.colHead]}>Fee</Text>
                      <Text style={[s.colAmt, s.colHead]}>Net</Text>
                    </View>

                    {(f.earnings ?? []).map((e) => {
                      const isWalkIn   = e.booking.specialRequests?.startsWith("[Walk-in]") ?? false;
                      const playerName = isWalkIn
                        ? e.booking.specialRequests!.replace("[Walk-in]", "").trim().split(" — ")[0].trim()
                        : e.booking.user.name;
                      return (
                        <View key={e.id} style={s.bookingRow}>
                          <View style={s.col1}>
                            <View style={s.playerRow}>
                              <Text style={s.playerName} numberOfLines={1}>{playerName}</Text>
                              {isWalkIn && (
                                <View style={s.walkInBadge}>
                                  <Text style={s.walkInBadgeText}>Walk-in</Text>
                                </View>
                              )}
                              <PayBadge method={e.paymentMethod} confirmed={e.cashConfirmed} />
                            </View>
                            <Text style={s.bookingMeta}>
                              {e.booking.bookingDate.slice(0, 10)} · {e.booking.startTime}–{e.booking.endTime}
                              {e.booking.court ? ` · ${e.booking.court.name}` : ""}
                            </Text>
                          </View>
                          <Text style={[s.colAmt, s.amtGross]}>{formatLKR(e.grossAmount)}</Text>
                          {isWalkIn
                            ? <Text style={[s.colAmt, s.amtNone]}>—</Text>
                            : <Text style={[s.colAmt, s.amtFee]}>−{formatLKR(e.platformFee)}</Text>
                          }
                          <Text style={[s.colAmt, s.amtNet]}>{formatLKR(e.netAmount)}</Text>
                        </View>
                      );
                    })}

                    <View style={s.facFooter}>
                      <Text style={[s.col1, s.footerLabel]}>Total</Text>
                      <Text style={[s.colAmt, s.footerGross]}>{formatLKR(f.gross)}</Text>
                      <Text style={[s.colAmt, s.footerFee]}>−{formatLKR(f.fee)}</Text>
                      <Text style={[s.colAmt, s.footerNet]}>{formatLKR(f.net)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
