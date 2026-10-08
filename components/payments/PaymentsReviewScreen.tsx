import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { formatLKR } from "@/lib/utils";
import { useInbox, useConfirmCashBooking, useMarkRefunded } from "@/lib/queries/payments";
import LoadingScreen from "@/components/ui/LoadingScreen";
import TransferReview from "./TransferReview";
import type { InboxSlot } from "@/types";
import { useT } from "@/lib/i18n/I18nProvider";
import { formatDay } from "@/lib/i18n/core";
import { uiLocale } from "@/lib/utils";

const DEEP = "#0f2a1d";
const RULE = "#d9e1da";

const shortDay = (iso: string) =>
  formatDay(new Date(iso.slice(0, 10) + "T00:00:00"), uiLocale(), { weekday: "short", day: "numeric", month: "short" });

/**
 * Needs action: everything the ground has to do in one list — check transfer receipts
 * (confirming one confirms the booking), confirm cash bookings, send refunds.
 */
export default function PaymentsReviewScreen() {
  const { t } = useT();
  const Colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role === "GROUND_WORKER" ? "GROUND_WORKER" : "GROUND_OWNER";
  const [groundId, setGroundId] = useState<string | undefined>(undefined);
  const { data, isLoading, isRefetching, refetch } = useInbox(groundId);
  const { mutate: confirmCash, isPending: confirming } = useConfirmCashBooking(role);
  const { mutate: markRefunded, isPending: refunding } = useMarkRefunded();

  const s = StyleSheet.create({
    scroll:   { padding: 16, paddingBottom: 120, gap: 22 },
    chips:    { gap: 8, paddingRight: 16 },
    chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: RULE, backgroundColor: Colors.card },
    chipOn:   { backgroundColor: DEEP, borderColor: DEEP },
    chipTxt:  { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    warn:     { flexDirection: "row", gap: 10, backgroundColor: Colors.warningLight, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.warning },
    warnTxt:  { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
    head:     { flexDirection: "row", alignItems: "baseline", gap: 8 },
    title:    { fontSize: 17, fontWeight: "700", color: DEEP },
    count:    { fontSize: 14, color: Colors.textMuted },
    hint:     { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginTop: 2, marginBottom: 10 },
    list:     { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: RULE },
    item:     { padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: RULE },
    top:      { flexDirection: "row", gap: 14 },
    when:     { width: 74 },
    whenDay:  { fontSize: 12, color: Colors.textMuted },
    whenTime: { fontSize: 22, fontWeight: "800", color: DEEP, fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
    whenTo:   { fontSize: 11.5, color: Colors.textMuted },
    who:      { flex: 1, gap: 2 },
    name:     { fontSize: 15, fontWeight: "700", color: DEEP },
    sub:      { fontSize: 13, color: Colors.textMuted },
    amt:      { fontSize: 17, fontWeight: "800", color: DEEP, fontVariant: ["tabular-nums"] },
    btn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 12 },
    btnTxt:   { fontSize: 14, fontWeight: "700" },
    empty:    { alignItems: "center", paddingVertical: 48, gap: 4 },
  });

  if (isLoading || !data) return <LoadingScreen />;

  const missing = data.grounds.filter((g) => g.status === "ACTIVE" && !g.account && (!groundId || g.id === groundId));
  const nothing = !data.toReview.length && !data.cashToConfirm.length && !data.refunds.length && !data.awaitingTransfer.length;

  const When = ({ x }: { x: InboxSlot }) => (
    <View style={s.when}>
      <Text style={s.whenDay}>{shortDay(x.date)}</Text>
      <Text style={s.whenTime}>{x.startTime}</Text>
      <Text style={s.whenTo}>to {x.endTime}</Text>
    </View>
  );
  const Who = ({ x, extra }: { x: InboxSlot; extra?: string | null }) => (
    <View style={s.who}>
      <Text style={s.name} numberOfLines={1}>{x.player}</Text>
      <Text style={s.sub} numberOfLines={1}>{[x.facilityName, extra ?? x.court].filter(Boolean).join(", ")}</Text>
      {x.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${x.phone}`)}>
          <Text style={[s.sub, { color: Colors.primary }]}>{x.phone}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  const Section = ({ title, count, hint, children }: { title: string; count: number; hint: string; children: React.ReactNode }) =>
    count === 0 ? null : (
      <View>
        <View style={s.head}><Text style={s.title}>{title}</Text><Text style={s.count}>{count}</Text></View>
        <Text style={s.hint}>{hint}</Text>
        <View style={s.list}>{children}</View>
      </View>
    );

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      {data.grounds.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {[{ id: undefined, name: t("All grounds") }, ...data.grounds].map((g) => {
            const on = groundId === g.id;
            return (
              <TouchableOpacity key={g.id ?? "all"} style={[s.chip, on && s.chipOn]} onPress={() => setGroundId(g.id)} activeOpacity={0.8}>
                <Text style={[s.chipTxt, on && { color: "#fff" }]}>{g.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {missing.length > 0 && (
        <TouchableOpacity style={s.warn} activeOpacity={data.canEditAccounts ? 0.8 : 1}
          onPress={() => data.canEditAccounts && router.push("/(owner)/earnings/bank-details")}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
          <Text style={s.warnTxt}>
            Players can&apos;t pay online for {missing.map((g) => g.name).join(", ")} — no bank account is set.
            {data.canEditAccounts ? t(" Tap to add one.") : t(" Ask the owner to add one.")}
          </Text>
        </TouchableOpacity>
      )}

      {nothing && (
        <View style={s.empty}>
          <Text style={s.title}>{t("Nothing needs you right now")}</Text>
          <Text style={s.sub}>{t("New receipts and booking requests show up here.")}</Text>
        </View>
      )}

      <Section title={t("Receipts to check")} count={data.toReview.length}
        hint={t("Check your bank app for the amount. Confirming the receipt confirms the booking and tells the player.")}>
        {data.toReview.map((r, i) => (
          <View key={`${r.kind}-${r.id}`} style={[s.item, i === 0 && { borderTopWidth: 0 }]}>
            <View style={s.top}>
              <When x={r} />
              <Who x={r} extra={r.label} />
              <Text style={s.amt}>{formatLKR(r.amount)}</Text>
            </View>
            <TransferReview kind={r.kind} id={r.id} playerName={r.player} amount={r.amount}
              paymentStatus="RECEIPT_SUBMITTED" receiptUrl={r.receiptUrl} rejectReason={null} />
          </View>
        ))}
      </Section>

      <Section title={t("Cash bookings to confirm")} count={data.cashToConfirm.length}
        hint={t("These players will pay at the ground. Confirm if the slot works for you.")}>
        {data.cashToConfirm.map((c, i) => (
          <View key={c.id} style={[s.item, i === 0 && { borderTopWidth: 0 }]}>
            <View style={s.top}><When x={c} /><Who x={c} /><Text style={s.amt}>{formatLKR(c.amount)}</Text></View>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.primary }]} disabled={confirming} activeOpacity={0.85}
              onPress={() => confirmCash(c.id, {
                onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
                onError:   (e) => Alert.alert(t("Error"), e.message),
              })}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={[s.btnTxt, { color: "#fff" }]}>{t("Confirm booking")}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Section>

      <Section title={t("Refunds you owe")} count={data.refunds.length}
        hint={t("Cancelled after the player paid. Send the money back from your bank, then mark it sent.")}>
        {data.refunds.map((r, i) => (
          <View key={r.id} style={[s.item, i === 0 && { borderTopWidth: 0 }]}>
            <View style={s.top}><When x={r} /><Who x={r} extra={t("{n}% refund", { n: r.percent })} /><Text style={s.amt}>{formatLKR(r.amount)}</Text></View>
            <TouchableOpacity style={[s.btn, { borderWidth: 1.5, borderColor: DEEP }]} disabled={refunding} activeOpacity={0.85}
              onPress={() => Alert.alert(t("Mark refund sent"), `Confirm you sent ${formatLKR(r.amount)} back to ${r.player}?`, [
                { text: t("Not yet"), style: "cancel" },
                { text: t("Yes, sent"), onPress: () => markRefunded({ bookingId: r.id }, { onError: (e) => Alert.alert(t("Error"), e.message) }) },
              ])}>
              <Ionicons name="return-down-back-outline" size={17} color={DEEP} />
              <Text style={[s.btnTxt, { color: DEEP }]}>{t("Mark refund sent")}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Section>

      <Section title={t("Waiting for the player's transfer")} count={data.awaitingTransfer.length}
        hint={t("Booked with Pay online, no receipt yet. Nothing to do — unpaid slots are released automatically.")}>
        {data.awaitingTransfer.map((a, i) => (
          <View key={a.id} style={[s.item, i === 0 && { borderTopWidth: 0 }, { opacity: 0.75 }]}>
            <View style={s.top}><When x={a} /><Who x={a} extra={a.disputed ? t("Player complained — GoPlay is checking") : a.rejected ? t("You sent the receipt back") : null} /></View>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}
