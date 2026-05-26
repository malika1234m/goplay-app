import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useOwnerBookings, useUpdateBookingStatus, useMarkNoShow } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatDate, formatLKR } from "@/lib/utils";

export default function BookingDetail() {
  const Colors = useColors();
  const { id }       = useLocalSearchParams<{ id: string }>();
  const router       = useRouter();
  const navigation   = useNavigation();
  const [receipt, setReceipt] = useState(false);

  const { data: active }  = useOwnerBookings({});
  const { data: pending } = useOwnerBookings({ status: "PENDING" });
  const { data: history } = useOwnerBookings({ history: true });

  const booking =
    active?.bookings.find((b) => b.id === id) ??
    pending?.bookings.find((b) => b.id === id) ??
    history?.bookings.find((b) => b.id === id);

  const { mutate: updateStatus, isPending: updating } = useUpdateBookingStatus();
  const { mutate: markNoShow,   isPending: noShowing } = useMarkNoShow();

  const busy = updating || noShowing;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll:    { padding: 16, paddingBottom: 120 },
    headerStrip:    { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    headerStripTop: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 12 },
    walkInBadge:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    walkInText:     { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
    receiptBtn:     { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto", backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    receiptBtnText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
    headerAmount:   { fontSize: 28, fontWeight: "900", color: Colors.text, letterSpacing: -0.5, marginBottom: 4 },
    headerDate:     { fontSize: 13, color: Colors.textMuted },
    section:      { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionHeader:{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
    sectionTitle: { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    sectionBody:  { gap: 10 },
    row:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    rowLabel:  { fontSize: 14, color: Colors.textMuted, flex: 1 },
    rowValue:  { fontSize: 14, color: Colors.text, fontWeight: "500", flex: 2, textAlign: "right" },
    rowBold:   { fontWeight: "700", color: Colors.primary, fontSize: 16 },
    actions:       { gap: 10, marginTop: 4 },
    actionBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    actionBtnBusy: { opacity: 0.6 },
    actionBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  const r = StyleSheet.create({
    overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet:       { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", paddingBottom: 32 },
    header:      { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
    checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
    headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.white, marginBottom: 4 },
    headerAmount:{ fontSize: 28, fontWeight: "900", color: Colors.white, letterSpacing: -0.5 },
    body:        { padding: 24, gap: 14 },
    divider:     { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
    row:         { flexDirection: "row", justifyContent: "space-between" },
    rowLabel:    { fontSize: 14, color: Colors.textMuted },
    rowValue:    { fontSize: 14, color: Colors.text, fontWeight: "500" },
    closeBtn:    { marginHorizontal: 24, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    closeBtnText:{ fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  useLayoutEffect(() => {
    if (booking) navigation.setOptions({ title: booking.facility.name });
  }, [booking]);

  if (!booking) return <LoadingScreen />;

  const isWalkIn   = booking.specialRequests?.startsWith("[Walk-in]") ?? false;
  const playerName = isWalkIn
    ? booking.specialRequests!.replace("[Walk-in]", "").trim().split(" — ")[0].trim()
    : booking.user.name;
  const notes = isWalkIn
    ? booking.specialRequests!.replace("[Walk-in]", "").trim().split(" — ")[1]?.trim()
    : booking.specialRequests;

  function confirm() {
    Alert.alert("Confirm Booking", `Confirm booking for ${playerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm", style: "default",
        onPress: () =>
          updateStatus({ id: booking!.id, status: "CONFIRMED" }, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setReceipt(true);
            },
            onError: (e) => Alert.alert("Error", e.message),
          }),
      },
    ]);
  }

  function complete() {
    if (booking!.paymentMethod === "ON_ARRIVAL") {
      Alert.alert("Mark Complete", "Was cash payment received?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cash Received", style: "default",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "COMPLETED", cashReceived: true }, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
              onError: (e) => Alert.alert("Error", e.message),
            }),
        },
        {
          text: "Cash Not Received", style: "destructive",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "COMPLETED", cashReceived: false }, {
              onSuccess: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.back(); },
              onError: (e) => Alert.alert("Error", e.message),
            }),
        },
      ]);
    } else {
      Alert.alert("Mark Complete", "Mark this booking as completed?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete", style: "default",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "COMPLETED" }, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
              onError: (e) => Alert.alert("Error", e.message),
            }),
        },
      ]);
    }
  }

  function cancel() {
    Alert.alert(
      "Cancel Booking",
      "Are you sure? This will notify the player and apply a cancellation strike to your facility.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking", style: "destructive",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "CANCELLED" }, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                router.back();
              },
              onError: (e) => Alert.alert("Error", e.message),
            }),
        },
      ]
    );
  }

  function noShow() {
    Alert.alert(
      "Mark No-Show",
      `${playerName} did not show up? This will penalise their account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark No-Show", style: "destructive",
          onPress: () =>
            markNoShow(booking!.id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                router.back();
              },
              onError: (e) => Alert.alert("Error", e.message),
            }),
        },
      ]
    );
  }

  // True once the booking's end time has passed (compared in local time).
  // bookingDate arrives as a full ISO string ("2026-05-23T00:00:00.000Z"),
  // so slice to "YYYY-MM-DD" before splitting.
  const bookingEnded = (() => {
    const [y, mo, d] = booking.bookingDate.slice(0, 10).split("-").map(Number);
    const [h, mi]    = booking.endTime.split(":").map(Number);
    return Date.now() >= new Date(y, mo - 1, d, h, mi).getTime();
  })();

  const canConfirm  = booking.status === "PENDING";
  const canComplete = booking.status === "CONFIRMED" && bookingEnded;
  const canNoShow   = booking.status === "CONFIRMED" && bookingEnded;
  const canCancel   = booking.status === "PENDING" || (booking.status === "CONFIRMED" && !bookingEnded);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header strip */}
        <View style={s.headerStrip}>
          <View style={s.headerStripTop}>
            <Badge status={booking.status} />
            {isWalkIn && (
              <View style={s.walkInBadge}>
                <Ionicons name="walk-outline" size={12} color={Colors.primaryDark} />
                <Text style={s.walkInText}>Walk-in</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.receiptBtn}
              onPress={() => setReceipt(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="receipt-outline" size={13} color={Colors.primary} />
              <Text style={s.receiptBtnText}>Receipt</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.headerAmount}>{formatLKR(booking.totalAmount)}</Text>
          <Text style={s.headerDate}>
            {formatDate(booking.bookingDate)}  ·  {booking.startTime} – {booking.endTime}
          </Text>
        </View>

        {/* Player */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>Player</Text>
          </View>
          <View style={s.sectionBody}>
            <View style={s.row}><Text style={s.rowLabel}>Name</Text><Text style={s.rowValue} numberOfLines={2}>{playerName}</Text></View>
            {!isWalkIn && <View style={s.row}><Text style={s.rowLabel}>Email</Text><Text style={s.rowValue} numberOfLines={2}>{booking.user.email}</Text></View>}
            {booking.contactNumber && <View style={s.row}><Text style={s.rowLabel}>Phone</Text><Text style={s.rowValue} numberOfLines={2}>{booking.contactNumber}</Text></View>}
            {!isWalkIn && booking.user.phone && <View style={s.row}><Text style={s.rowLabel}>Phone</Text><Text style={s.rowValue} numberOfLines={2}>{booking.user.phone}</Text></View>}
          </View>
        </View>

        {/* Booking */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>Booking</Text>
          </View>
          <View style={s.sectionBody}>
            <View style={s.row}><Text style={s.rowLabel}>Date</Text><Text style={s.rowValue} numberOfLines={2}>{formatDate(booking.bookingDate)}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Time</Text><Text style={s.rowValue} numberOfLines={2}>{`${booking.startTime} – ${booking.endTime} (${booking.totalHours}h)`}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Facility</Text><Text style={s.rowValue} numberOfLines={2}>{booking.facility.name}</Text></View>
            {booking.court && <View style={s.row}><Text style={s.rowLabel}>Court</Text><Text style={s.rowValue} numberOfLines={2}>{booking.court.name}</Text></View>}
            {notes && <View style={s.row}><Text style={s.rowLabel}>Notes</Text><Text style={s.rowValue} numberOfLines={2}>{notes}</Text></View>}
          </View>
        </View>

        {/* Payment */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="card-outline" size={14} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>Payment</Text>
          </View>
          <View style={s.sectionBody}>
            <View style={s.row}><Text style={s.rowLabel}>Amount</Text><Text style={[s.rowValue, s.rowBold]} numberOfLines={2}>{formatLKR(booking.totalAmount)}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Method</Text><Text style={s.rowValue} numberOfLines={2}>{booking.paymentMethod === "ONLINE" ? "Online (PayHere)" : "Cash on Arrival"}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Status</Text><Text style={s.rowValue} numberOfLines={2}>{booking.paymentMethod === "ONLINE" ? booking.paymentStatus : "—"}</Text></View>
          </View>
        </View>

        {/* Actions */}
        {booking.status === "CONFIRMED" && !bookingEnded && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.warningLight, borderRadius: 12, padding: 12, marginTop: 4 }}>
            <Ionicons name="time-outline" size={15} color={Colors.warning} />
            <Text style={{ fontSize: 13, color: Colors.warning, fontWeight: "600", flex: 1 }}>
              Mark Completed / No-Show available after the session ends ({booking.endTime})
            </Text>
          </View>
        )}
        {(canConfirm || canComplete || canNoShow || canCancel) && (
          <View style={s.actions}>
            {canConfirm  && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.primary }, busy && s.actionBtnBusy]} onPress={confirm} disabled={busy} activeOpacity={0.8}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={s.actionBtnText}>Confirm Booking</Text></>}
              </TouchableOpacity>
            )}
            {canComplete && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: "#0891b2" }, busy && s.actionBtnBusy]} onPress={complete} disabled={busy} activeOpacity={0.8}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="flag-outline" size={18} color="#fff" /><Text style={s.actionBtnText}>Mark Completed</Text></>}
              </TouchableOpacity>
            )}
            {canNoShow && (
              <TouchableOpacity style={[s.actionBtn, { borderWidth: 1.5, borderColor: "#d97706", backgroundColor: "transparent" }, busy && s.actionBtnBusy]} onPress={noShow} disabled={busy} activeOpacity={0.8}>
                {busy ? <ActivityIndicator color="#d97706" size="small" /> : <><Ionicons name="person-remove-outline" size={18} color="#d97706" /><Text style={[s.actionBtnText, { color: "#d97706" }]}>Mark No-Show</Text></>}
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={[s.actionBtn, { borderWidth: 1.5, borderColor: Colors.error, backgroundColor: "transparent" }, busy && s.actionBtnBusy]} onPress={cancel} disabled={busy} activeOpacity={0.8}>
                {busy ? <ActivityIndicator color={Colors.error} size="small" /> : <><Ionicons name="close-circle-outline" size={18} color={Colors.error} /><Text style={[s.actionBtnText, { color: Colors.error }]}>Cancel Booking</Text></>}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Receipt Modal */}
      <Modal visible={receipt} animationType="slide" transparent>
        <View style={r.overlay}>
          <View style={r.sheet}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={r.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={r.checkCircle}>
                <Ionicons name="checkmark" size={32} color={Colors.white} />
              </View>
              <Text style={r.headerTitle}>Booking Confirmed</Text>
              <Text style={r.headerAmount}>{formatLKR(booking.totalAmount)}</Text>
            </LinearGradient>

            <View style={r.body}>
              <View style={r.row}><Text style={r.rowLabel}>Player</Text><Text style={r.rowValue}>{playerName}</Text></View>
              <View style={r.row}><Text style={r.rowLabel}>Facility</Text><Text style={r.rowValue}>{booking.facility.name}</Text></View>
              {booking.court && <View style={r.row}><Text style={r.rowLabel}>Court</Text><Text style={r.rowValue}>{booking.court.name}</Text></View>}
              <View style={r.row}><Text style={r.rowLabel}>Date</Text><Text style={r.rowValue}>{formatDate(booking.bookingDate)}</Text></View>
              <View style={r.row}><Text style={r.rowLabel}>Time</Text><Text style={r.rowValue}>{`${booking.startTime} – ${booking.endTime}`}</Text></View>
              <View style={r.row}><Text style={r.rowLabel}>Payment</Text><Text style={r.rowValue}>{booking.paymentMethod === "ONLINE" ? "Online (PayHere)" : "Cash on Arrival"}</Text></View>
              <View style={r.divider} />
              <View style={r.row}><Text style={r.rowLabel}>Status</Text><Text style={[r.rowValue, { color: Colors.primary, fontWeight: "700" }]}>{booking.status}</Text></View>
            </View>

            <TouchableOpacity style={r.closeBtn} onPress={() => { setReceipt(false); if (booking.status === "CONFIRMED") router.back(); }} activeOpacity={0.85}>
              <Text style={r.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
