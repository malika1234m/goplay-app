import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWorkerBookings, useUpdateWorkerBookingStatus } from "@/lib/queries/worker";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatDate, formatLKR } from "@/lib/utils";

export default function WorkerBookingDetail() {
  const Colors = useColors();
  const { id }       = useLocalSearchParams<{ id: string }>();
  const router       = useRouter();
  const navigation   = useNavigation();

  const { data: all }     = useWorkerBookings({});
  const { data: pending } = useWorkerBookings({ status: "PENDING" });
  const { data: history } = useWorkerBookings({ history: true });

  const booking =
    all?.bookings.find((b) => b.id === id)     ??
    pending?.bookings.find((b) => b.id === id) ??
    history?.bookings.find((b) => b.id === id);

  const { mutate: updateStatus, isPending: busy } = useUpdateWorkerBookingStatus();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll:    { padding: 16, paddingBottom: 40 },

    headerStrip:    { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    headerStripTop: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 12 },
    walkInBadge:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    walkInText:     { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
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

    actions:       { gap: 10 },
    actionBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    actionBtnBusy: { opacity: 0.6 },
    actionBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  useLayoutEffect(() => {
    if (booking) navigation.setOptions({ title: booking.playerName });
  }, [booking]);

  if (!booking) return <LoadingScreen />;

  const isWalkIn = booking.specialRequests?.startsWith("[Walk-in]") ?? false;

  function confirm() {
    Alert.alert("Confirm Booking", `Confirm booking for ${booking!.playerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm", style: "default",
        onPress: () =>
          updateStatus({ id: booking!.id, status: "CONFIRMED" }, {
            onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); },
            onError:   (e) => Alert.alert("Error", e.message),
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
              onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); },
              onError:   (e) => Alert.alert("Error", e.message),
            }),
        },
        {
          text: "Not Received", style: "destructive",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "COMPLETED", cashReceived: false }, {
              onSuccess: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.back(); },
              onError:   (e) => Alert.alert("Error", e.message),
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
              onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); },
              onError:   (e) => Alert.alert("Error", e.message),
            }),
        },
      ]);
    }
  }

  function cancel() {
    Alert.alert(
      "Cancel Booking",
      "Cancel this booking? A strike will be recorded on your facility.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Booking", style: "destructive",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "CANCELLED" }, {
              onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); router.back(); },
              onError:   (e) => Alert.alert("Error", e.message),
            }),
        },
      ]
    );
  }

  function noShow() {
    Alert.alert(
      "Mark No-Show",
      `${booking!.playerName} didn't show up? This will penalise their account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark No-Show", style: "destructive",
          onPress: () =>
            updateStatus({ id: booking!.id, status: "NO_SHOW" }, {
              onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.back(); },
              onError:   (e) => Alert.alert("Error", e.message),
            }),
        },
      ]
    );
  }

  function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    if (!value) return null;
    return (
      <View style={s.row}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={[s.rowValue, bold && s.rowBold]} numberOfLines={2}>{value}</Text>
      </View>
    );
  }

  function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name={icon as never} size={14} color={Colors.textMuted} />
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <View style={s.sectionBody}>{children}</View>
      </View>
    );
  }

  function ActionBtn({ label, color, icon, onPress, outline }: {
    label: string; color: string; icon: string; onPress: () => void; outline?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[
          s.actionBtn,
          outline ? { borderWidth: 1.5, borderColor: color, backgroundColor: "transparent" } : { backgroundColor: color },
          busy && s.actionBtnBusy,
        ]}
        onPress={onPress}
        disabled={busy}
        activeOpacity={0.8}
      >
        {busy ? (
          <ActivityIndicator color={outline ? color : "#fff"} size="small" />
        ) : (
          <>
            <Ionicons name={icon as never} size={18} color={outline ? color : "#fff"} />
            <Text style={[s.actionBtnText, outline && { color }]}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  const canConfirm  = booking.status === "PENDING";
  const canComplete = booking.status === "CONFIRMED";
  const canNoShow   = booking.status === "CONFIRMED";
  const canCancel   = booking.status === "PENDING" || booking.status === "CONFIRMED";

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
          </View>
          <Text style={s.headerAmount}>{formatLKR(booking.totalAmount)}</Text>
          <Text style={s.headerDate}>
            {formatDate(booking.bookingDate)}  ·  {booking.startTime} – {booking.endTime}
          </Text>
        </View>

        {/* Player */}
        <Section title="Player" icon="person-outline">
          <Row label="Name"  value={booking.playerName} />
          {!isWalkIn && <Row label="Email"  value={booking.playerEmail} />}
          {(booking.contactNumber ?? booking.playerPhone) && (
            <Row label="Phone" value={(booking.contactNumber ?? booking.playerPhone)!} />
          )}
        </Section>

        {/* Booking */}
        <Section title="Booking" icon="calendar-outline">
          <Row label="Date"  value={formatDate(booking.bookingDate)} />
          <Row label="Time"  value={`${booking.startTime} – ${booking.endTime}`} />
          {booking.courtName && <Row label="Court"  value={booking.courtName} />}
          {!isWalkIn && booking.specialRequests && (
            <Row label="Notes"  value={booking.specialRequests} />
          )}
          {isWalkIn && booking.specialRequests && (
            <Row label="Notes"  value={booking.specialRequests.replace("[Walk-in]","").trim().split(" — ")[1]?.trim() ?? ""} />
          )}
        </Section>

        {/* Payment */}
        <Section title="Payment" icon="card-outline">
          <Row label="Amount" value={formatLKR(booking.totalAmount)} bold />
          <Row label="Method" value={booking.paymentMethod === "ONLINE" ? "Online (PayHere)" : "Cash on Arrival"} />
          {booking.paymentMethod === "ONLINE" && (
            <Row label="Status" value={booking.paymentStatus} />
          )}
        </Section>

        {/* Actions */}
        {(canConfirm || canComplete || canNoShow || canCancel) && (
          <View style={s.actions}>
            {canConfirm  && <ActionBtn label="Confirm Booking" color={Colors.primary} icon="checkmark-circle-outline" onPress={confirm}  />}
            {canComplete && <ActionBtn label="Mark Completed"  color="#0891b2"        icon="flag-outline"             onPress={complete} />}
            {canNoShow   && <ActionBtn label="Mark No-Show"    color="#d97706"        icon="person-remove-outline"    onPress={noShow}   outline />}
            {canCancel   && <ActionBtn label="Cancel Booking"  color={Colors.error}   icon="close-circle-outline"     onPress={cancel}   outline />}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
