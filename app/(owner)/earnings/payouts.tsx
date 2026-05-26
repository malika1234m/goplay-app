import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePayoutData, useRequestPayout } from "@/lib/queries/earnings";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import { formatLKR, formatDate } from "@/lib/utils";
import type { Payout, OnlineEarning } from "@/types";

const PAYOUT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:    { bg: "#fef9c3", text: "#92400e", label: "Pending"    },
  PROCESSING: { bg: "#dbeafe", text: "#1e40af", label: "Processing" },
  COMPLETED:  { bg: "#dcfce7", text: "#14532d", label: "Completed"  },
  FAILED:     { bg: "#fee2e2", text: "#7f1d1d", label: "Failed"     },
};

export default function PayoutsScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = usePayoutData();
  const { mutate: requestPayout, isPending: requesting } = useRequestPayout();

  const HOW_IT_WORKS = [
    { icon: "card-outline",        color: "#2563eb", text: "Player pays online via card → money goes to GoPlay admin's account" },
    { icon: "checkmark-circle-outline", color: "#d97706", text: "You mark the session complete → net earnings appear here as available balance" },
    { icon: "wallet-outline",      color: Colors.primary, text: "You request a payout → admin receives a notification and reviews" },
    { icon: "checkmark-done-circle-outline", color: "#7c3aed", text: "Admin transfers to your bank → you get notified with the bank reference" },
  ];

  if (isLoading) return <LoadingScreen />;

  const bal        = data?.balance;
  const com        = data?.commission;
  const payouts    = data?.payouts ?? [];
  const settlements = data?.commissionSettlements ?? [];
  const onlineEarnings = data?.onlineEarnings ?? [];
  const settings   = data?.settings;
  const hasPending = payouts.some((p) => p.status === "PENDING" || p.status === "PROCESSING");
  const pendingReq = data?.pendingCommissionRequest ?? null;

  const canRequest =
    !hasPending &&
    (data?.cooldownRemaining ?? 0) === 0 &&
    (bal?.availableBalance ?? 0) >= (settings?.minPayout ?? 1000) &&
    data?.hasBankDetails;

  function handleRequest() {
    const amount = bal?.availableBalance ?? 0;
    Alert.alert(
      "Request Payout",
      `Request a payout of ${formatLKR(amount)}?\n\nThis will be sent to your registered bank account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request", style: "default",
          onPress: () =>
            requestPayout(undefined, {
              onSuccess: () => Alert.alert("Submitted", "Your payout request has been submitted. The admin will process it shortly."),
              onError:   (e) => Alert.alert("Error", e.message),
            }),
        },
      ]
    );
  }

  const s = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 120 },

    hero:               { borderRadius: 20, padding: 22, marginBottom: 14, alignItems: "center" },
    heroLabel:          { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    heroAmount:         { fontSize: 38, fontWeight: "900", color: Colors.white, letterSpacing: -1 },
    heroSub:            { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4, marginBottom: 20, textAlign: "center" },
    requestBtn:         { backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, alignItems: "center" },
    requestBtnDisabled: { opacity: 0.5 },
    requestBtnText:     { fontSize: 15, fontWeight: "700", color: Colors.white },
    addBankBtn:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
    addBankText:        { fontSize: 13, fontWeight: "600", color: Colors.white, textAlign: "center" },

    card:            { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    commissionCard:  { backgroundColor: "#fffbeb", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#fde68a" },
    cardTitle:       { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
    divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
    commissionNote:  { fontSize: 12, color: "#92400e", marginTop: 10, lineHeight: 18 },

    balRow:             { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    balLabel:           { fontSize: 13, color: Colors.text },
    balLabelMuted:      { color: Colors.textMuted },
    balValue:           { fontSize: 13, fontWeight: "600", color: Colors.text },
    balValueBold:       { fontWeight: "700" },
    balValueHighlight:  { fontSize: 15, fontWeight: "800", color: Colors.primary },

    onlineHeader:    { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
    onlineCol1:      { flex: 1, minWidth: 0 },
    onlineColAmt:    { width: 64, textAlign: "right" },
    colHeading:      { fontSize: 10, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase" },
    onlineRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.background },
    onlinePlayer:    { fontSize: 13, fontWeight: "600", color: Colors.text },
    onlineMeta:      { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    onlineTime:      { fontSize: 11, color: Colors.textMuted },
    onlineTotalRow:  { flexDirection: "row", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },

    bankRow:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    bankIconBox:  { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
    bankInfo:     { flex: 1 },
    bankRowTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
    bankRowSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

    section:      { marginTop: 4 },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

    payoutRow:    { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    payoutLeft:   { marginRight: 12 },
    flex:         { flex: 1 },
    payoutAmount: { fontSize: 16, fontWeight: "800", color: Colors.text },
    payoutDate:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    payoutRef:    { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontStyle: "italic" },
    statusBadge:  { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText:   { fontSize: 12, fontWeight: "700" },

    settlementHeader:    { backgroundColor: "#fffbeb", borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 6, borderWidth: 1, borderColor: "#fde68a" },
    settlementHeaderText:{ fontSize: 11, fontWeight: "700", color: "#92400e", textTransform: "uppercase", letterSpacing: 0.4 },
    settlementHeaderSub: { fontSize: 11, color: "#92400e", marginTop: 3, lineHeight: 16 },

    howCard:      { backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
    howTitle:     { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
    howStep:      { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
    howIconBox:   { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    howStepText:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, flex: 1 },
  });

  function BalanceRow({ label, value, muted, bold, highlight }: {
    label: string; value: string; muted?: boolean; bold?: boolean; highlight?: boolean;
  }) {
    return (
      <View style={s.balRow}>
        <Text style={[s.balLabel, muted && s.balLabelMuted]}>{label}</Text>
        <Text style={[s.balValue, bold && s.balValueBold, highlight && s.balValueHighlight]}>
          {value}
        </Text>
      </View>
    );
  }

  function OnlineEarningRow({ earning: e }: { earning: OnlineEarning }) {
    return (
      <View style={s.onlineRow}>
        <View style={s.onlineCol1}>
          <Text style={s.onlinePlayer} numberOfLines={1}>{e.booking.user.name}</Text>
          <Text style={s.onlineMeta}>
            {e.facility.name} · {formatDate(e.booking.bookingDate)}
          </Text>
          <Text style={s.onlineTime}>{e.booking.startTime}–{e.booking.endTime}</Text>
        </View>
        <Text style={[s.onlineColAmt, { fontSize: 12, color: Colors.textSecondary }]}>{formatLKR(e.grossAmount)}</Text>
        <Text style={[s.onlineColAmt, { fontSize: 12, color: "#f87171" }]}>−{formatLKR(e.platformFee)}</Text>
        <Text style={[s.onlineColAmt, { fontSize: 13, fontWeight: "700", color: Colors.primary }]}>{formatLKR(e.netAmount)}</Text>
      </View>
    );
  }

  function PayoutRow({ payout }: { payout: Payout }) {
    const st = PAYOUT_STATUS[payout.status] ?? PAYOUT_STATUS.PENDING;
    return (
      <View style={s.payoutRow}>
        <View style={s.payoutLeft}>
          <Ionicons name="arrow-up-circle-outline" size={28} color={Colors.primary} />
        </View>
        <View style={s.flex}>
          <Text style={s.payoutAmount}>{formatLKR(payout.netAmount)}</Text>
          <Text style={s.payoutDate}>Requested {formatDate(payout.requestedAt)}</Text>
          {payout.processedAt && (
            <Text style={s.payoutDate}>Processed {formatDate(payout.processedAt)}</Text>
          )}
          {payout.reference && <Text style={s.payoutRef}>Ref: {payout.reference}</Text>}
          {payout.notes && <Text style={s.payoutRef}>{payout.notes}</Text>}
        </View>
        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      {/* Hero available balance */}
      <LinearGradient
        colors={[Colors.navy, Colors.navyDark]}
        style={s.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={s.heroLabel}>Available Balance</Text>
        <Text style={s.heroAmount}>{formatLKR(bal?.availableBalance ?? 0)}</Text>
        <Text style={s.heroSub}>
          From online payments · Net after {settings?.commissionRate ?? 10}% platform fee
        </Text>

        {!data?.hasBankDetails ? (
          <TouchableOpacity style={s.addBankBtn} onPress={() => router.push("/(owner)/earnings/bank-details")}>
            <Ionicons name="card-outline" size={16} color={Colors.white} />
            <Text style={s.addBankText}>Add Bank Details to Request Payout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.requestBtn, !canRequest && s.requestBtnDisabled]}
            onPress={handleRequest}
            disabled={!canRequest || requesting}
          >
            {requesting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={s.requestBtnText}>
                {hasPending
                  ? "Payout In Progress"
                  : (data?.cooldownRemaining ?? 0) > 0
                  ? `Available in ${data!.cooldownRemaining} day${data!.cooldownRemaining > 1 ? "s" : ""}`
                  : (bal?.availableBalance ?? 0) < (settings?.minPayout ?? 1000)
                  ? `Min payout: ${formatLKR(settings?.minPayout ?? 1000)}`
                  : "Request Payout"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Balance breakdown */}
      <View style={s.card}>
        <Text style={s.cardTitle}>ONLINE EARNINGS BREAKDOWN</Text>
        <BalanceRow label="Total gross (online)"   value={formatLKR(bal?.grossOnline   ?? 0)} />
        <BalanceRow label="Platform fees deducted" value={`− ${formatLKR(bal?.feeOnline ?? 0)}`} muted />
        <BalanceRow label="Net earnings"           value={formatLKR(bal?.netOnline     ?? 0)} bold />
        <View style={s.divider} />
        <BalanceRow label="Already paid out"       value={`− ${formatLKR(bal?.paidOut  ?? 0)}`} muted />
        <BalanceRow label="In-flight requests"     value={`− ${formatLKR(bal?.inFlight ?? 0)}`} muted />
        <BalanceRow label="Available balance"      value={formatLKR(bal?.availableBalance ?? 0)} highlight />
      </View>

      {/* Online bookings list */}
      {onlineEarnings.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>ONLINE BOOKINGS ({onlineEarnings.length})</Text>
          <View style={s.onlineHeader}>
            <Text style={[s.onlineCol1, s.colHeading]}>Booking</Text>
            <Text style={[s.onlineColAmt, s.colHeading]}>Gross</Text>
            <Text style={[s.onlineColAmt, s.colHeading]}>Fee</Text>
            <Text style={[s.onlineColAmt, s.colHeading]}>Net</Text>
          </View>
          {onlineEarnings.map((e) => (
            <OnlineEarningRow key={e.id} earning={e} />
          ))}
          <View style={[s.onlineTotalRow, { marginTop: 4 }]}>
            <Text style={[s.onlineCol1, { fontSize: 12, fontWeight: "700", color: Colors.textSecondary }]}>Total</Text>
            <Text style={[s.onlineColAmt, { fontSize: 12, fontWeight: "600", color: Colors.textSecondary }]}>
              {formatLKR(bal?.grossOnline ?? 0)}
            </Text>
            <Text style={[s.onlineColAmt, { fontSize: 12, fontWeight: "600", color: "#f87171" }]}>
              −{formatLKR(bal?.feeOnline ?? 0)}
            </Text>
            <Text style={[s.onlineColAmt, { fontSize: 13, fontWeight: "800", color: Colors.primary }]}>
              {formatLKR(bal?.netOnline ?? 0)}
            </Text>
          </View>
        </View>
      )}

      {/* Commission info */}
      {(com?.unpaidCommission ?? 0) > 0 && (
        <View style={s.commissionCard}>
          <Text style={s.cardTitle}>COMMISSION OWED TO PLATFORM</Text>
          <BalanceRow label="Total platform commission"  value={formatLKR(com?.totalCommission ?? 0)} />
          <BalanceRow label="Already collected (online)" value={`− ${formatLKR(com?.paidCommission ?? 0)}`} muted />
          <BalanceRow label="Still owed (cash bookings)" value={formatLKR(com?.cashUnpaid ?? 0)} bold />
          <Text style={s.commissionNote}>
            Cash booking commissions are collected separately by the admin and may be deducted from future payouts.
          </Text>
        </View>
      )}

      {/* Pending commission request from admin */}
      {pendingReq && (
        <View style={{ backgroundColor: "#fefce8", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: "#fde047" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Ionicons name="notifications-outline" size={16} color="#ca8a04" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Commission Payment Requested
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#92400e", marginBottom: 4 }}>
            {formatLKR(pendingReq.amount)}
          </Text>
          <Text style={{ fontSize: 13, color: "#92400e", lineHeight: 18 }}>
            GoPlay admin has requested this amount as platform commission from your cash bookings.
            Please contact the admin to arrange payment.
          </Text>
          <Text style={{ fontSize: 11, color: "#a16207", marginTop: 6 }}>
            Requested on {new Date(pendingReq.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      )}

      {/* Bank details shortcut */}
      <TouchableOpacity style={s.bankRow} onPress={() => router.push("/(owner)/earnings/bank-details")} activeOpacity={0.8}>
        <View style={s.bankIconBox}>
          <Ionicons name="business-outline" size={20} color={Colors.primary} />
        </View>
        <View style={s.bankInfo}>
          <Text style={s.bankRowTitle}>Bank Details</Text>
          <Text style={s.bankRowSub}>
            {data?.hasBankDetails ? "Update your payout account" : "Add bank details to receive payments"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Payout history */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>PAYOUT HISTORY</Text>
        {payouts.length === 0 ? (
          <EmptyState icon="card-outline" title="No payouts yet" sub="Your first payout will appear here." />
        ) : (
          payouts.map((p) => <PayoutRow key={p.id} payout={p} />)
        )}

        {/* Commission settlements */}
        {settlements.length > 0 && (
          <>
            <View style={s.settlementHeader}>
              <Text style={s.settlementHeaderText}>COMMISSION DEDUCTIONS</Text>
              <Text style={s.settlementHeaderSub}>Amounts deducted by admin as platform commission settlement</Text>
            </View>
            {settlements.map((s_) => (
              <View key={s_.id} style={[s.payoutRow, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
                <View style={s.payoutLeft}>
                  <Ionicons name="remove-circle-outline" size={28} color="#d97706" />
                </View>
                <View style={s.flex}>
                  <Text style={[s.payoutAmount, { color: "#92400e" }]}>−{formatLKR(s_.netAmount)}</Text>
                  <Text style={s.payoutDate}>Settled {formatDate(s_.requestedAt)}</Text>
                  {s_.notes && <Text style={s.payoutRef}>{s_.notes}</Text>}
                </View>
                <View style={[s.statusBadge, { backgroundColor: "#fef3c7" }]}>
                  <Text style={[s.statusText, { color: "#92400e" }]}>Commission</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* How payouts work */}
      <View style={s.howCard}>
        <Text style={s.howTitle}>HOW PAYOUTS WORK</Text>
        {HOW_IT_WORKS.map((step, i) => (
          <View key={i} style={s.howStep}>
            <View style={[s.howIconBox, { backgroundColor: `${step.color}18` }]}>
              <Ionicons name={step.icon as never} size={16} color={step.color} />
            </View>
            <Text style={s.howStepText}>{step.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
