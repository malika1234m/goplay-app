import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, useTheme } from "@/lib/theme";
import { formatDate, formatLKR } from "@/lib/utils";
import type { Booking } from "@/types";

interface Props {
  booking:  Booking;
  onPress?: () => void;
}

const STATUS_META: Record<string, { color: string; icon: string; label: string }> = {
  PENDING:   { color: "#f59e0b", icon: "time-outline",             label: "Awaiting Confirmation" },
  CONFIRMED: { color: "#16a34a", icon: "checkmark-circle-outline", label: "Confirmed"              },
  COMPLETED: { color: "#0891b2", icon: "trophy-outline",           label: "Completed"              },
  CANCELLED: { color: "#ef4444", icon: "close-circle-outline",     label: "Cancelled"              },
  NO_SHOW:   { color: "#f97316", icon: "ban-outline",              label: "No Show"                },
};

const PAY_LABEL: Record<string, string> = {
  ONLINE:     "Online",
  ON_ARRIVAL: "Cash",
};

export default function BookingCard({ booking, onPress }: Props) {
  const Colors  = useColors();
  const { isDark } = useTheme();
  const meta    = STATUS_META[booking.status] ?? { color: Colors.primary, icon: "ellipse-outline", label: "" };

  const isWalkIn   = booking.specialRequests?.startsWith("[Walk-in]") ?? false;
  const playerName = isWalkIn
    ? booking.specialRequests!.replace("[Walk-in]", "").trim().split(" — ")[0].trim()
    : booking.user.name;

  // Subtle tinted bg that works in both light and dark
  const cardBg     = isDark ? Colors.surface : Colors.card;
  const pillBg     = meta.color + (isDark ? "30" : "18");
  const accentBg   = meta.color + (isDark ? "22" : "12");

  const s = StyleSheet.create({
    card:       {
      backgroundColor: cardBg,
      borderRadius:    18,
      marginBottom:    12,
      borderWidth:     1,
      borderColor:     isDark ? Colors.border : meta.color + "30",
      shadowColor:     meta.color,
      shadowOffset:    { width: 0, height: 3 },
      shadowOpacity:   isDark ? 0.2 : 0.08,
      shadowRadius:    10,
      elevation:       3,
      overflow:        "hidden",
    },

    // Top accent header strip
    header:     {
      flexDirection:   "row",
      alignItems:      "center",
      justifyContent:  "space-between",
      backgroundColor: accentBg,
      paddingHorizontal: 14,
      paddingVertical:   8,
      borderBottomWidth: 1,
      borderBottomColor: meta.color + "20",
    },
    statusRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
    statusDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: meta.color },
    statusText: { fontSize: 12, fontWeight: "700", color: meta.color },

    payPill:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: pillBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    payIcon:    {},
    payText:    { fontSize: 11, fontWeight: "700", color: meta.color },

    // Card body
    body:       { padding: 14 },

    topRow:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
    nameBlock:  { flex: 1, marginRight: 10 },
    player:     { fontSize: 16, fontWeight: "800", color: Colors.text, marginBottom: 2 },
    facility:   { fontSize: 12, color: Colors.textMuted },

    amountBlock: { alignItems: "flex-end" },
    amount:      { fontSize: 18, fontWeight: "800", color: meta.color },
    amountSub:   { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

    divider:    { height: 1, backgroundColor: Colors.border, marginBottom: 10 },

    infoRow:    { flexDirection: "row", alignItems: "center", gap: 16 },
    infoItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
    infoText:   { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },

    walkInPill: { alignSelf: "flex-start", backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
    walkInText: { fontSize: 10, fontWeight: "700", color: Colors.primary },

    courtPill:  { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 8, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
    courtText:  { fontSize: 11, fontWeight: "600", color: Colors.textSecondary },
  });

  const hours = booking.totalHours === 1 ? "1 hr" : `${booking.totalHours} hrs`;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.72}>

      {/* Status header strip */}
      <View style={s.header}>
        <View style={s.statusRow}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>{meta.label}</Text>
        </View>
        <View style={s.payPill}>
          <Ionicons
            name={booking.paymentMethod === "ONLINE" ? "card-outline" : "cash-outline"}
            size={11}
            color={meta.color}
          />
          <Text style={s.payText}>{PAY_LABEL[booking.paymentMethod] ?? booking.paymentMethod}</Text>
        </View>
      </View>

      <View style={s.body}>
        {/* Name + Amount */}
        <View style={s.topRow}>
          <View style={s.nameBlock}>
            <Text style={s.player} numberOfLines={1}>{playerName}</Text>
            <Text style={s.facility} numberOfLines={1}>{booking.facility.name}</Text>
            {isWalkIn && (
              <View style={s.walkInPill}>
                <Text style={s.walkInText}>Walk-in</Text>
              </View>
            )}
          </View>
          <View style={s.amountBlock}>
            <Text style={s.amount}>{formatLKR(booking.totalAmount)}</Text>
            <Text style={s.amountSub}>{hours}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Time + Date */}
        <View style={s.infoRow}>
          <View style={s.infoItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={s.infoText}>{booking.startTime} – {booking.endTime}</Text>
          </View>
          <View style={s.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={s.infoText}>{formatDate(booking.bookingDate)}</Text>
          </View>
        </View>

        {/* Court pill */}
        {booking.court && (
          <View style={s.courtPill}>
            <Ionicons name="grid-outline" size={11} color={Colors.textSecondary} />
            <Text style={s.courtText}>{booking.court.name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
