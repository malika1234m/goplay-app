import { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWorkerBookings } from "@/lib/queries/worker";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatLKR, isoDate, addDays } from "@/lib/utils";

const DAY_LABELS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildWeek() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => addDays(today, i));
}

export default function WorkerSchedule() {
  const Colors = useColors();
  const router = useRouter();
  const days   = useMemo(() => buildWeek(), []);
  const [selectedISO, setSelectedISO] = useState(isoDate(days[0]));

  const STATUS_LEFT_COLOR: Record<string, string> = {
    PENDING:   Colors.warning,
    CONFIRMED: Colors.primary,
    COMPLETED: Colors.info,
    CANCELLED: Colors.error,
    NO_SHOW:   Colors.textMuted,
  };

  const s = StyleSheet.create({
    safe:       { flex: 1, backgroundColor: Colors.background },
    headerBar:  { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle:{ fontSize: 22, fontWeight: "800", color: Colors.text },

    dayPickerWrap:    { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    dayPickerContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
    dayCell:          { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, minWidth: 56 },
    dayCellActive:    { backgroundColor: Colors.primary },
    dayCellToday:     { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryMid },
    dayLabel:         { fontSize: 10, fontWeight: "700", color: Colors.textMuted, marginBottom: 4, letterSpacing: 0.3 },
    dayLabelActive:   { color: "rgba(255,255,255,0.8)" },
    dayNum:           { fontSize: 20, fontWeight: "800", color: Colors.text },
    dayNumActive:     { color: Colors.white },

    dateLabelRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
    dateLabelLeft:     { flexDirection: "row", alignItems: "center", gap: 6 },
    dateLabel:         { fontSize: 14, fontWeight: "700", color: Colors.text },
    bookingCountBadge: { backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    bookingCountText:  { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },

    list:      { paddingHorizontal: 16, paddingBottom: 24 },
    listEmpty: { flex: 1 },

    slot:        { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: "hidden" },
    slotAccent:  { width: 4 },
    slotTimeCol: { width: 52, alignItems: "center", marginRight: 12, paddingVertical: 14 },
    slotTime:    { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    slotLine:    { flex: 1, width: 1, backgroundColor: Colors.border, marginVertical: 4, minHeight: 16 },
    slotBody:    { flex: 1, paddingVertical: 14, paddingRight: 14 },
    slotRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
    slotPlayer:  { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1, marginRight: 8 },
    slotCourt:   { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
    slotFooter:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    slotAmount:  { fontSize: 13, fontWeight: "700", color: Colors.primary },
  });

  const { data, isLoading, refetch, isRefetching } = useWorkerBookings({ date: selectedISO });
  const bookings = (data?.bookings ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.headerBar}>
        <Text style={s.headerTitle}>Schedule</Text>
      </View>

      {/* Day picker */}
      <View style={s.dayPickerWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayPickerContent}>
          {days.map((d) => {
            const iso        = isoDate(d);
            const isSelected = iso === selectedISO;
            const isToday    = iso === isoDate(new Date());
            return (
              <TouchableOpacity
                key={iso}
                style={[s.dayCell, isSelected && s.dayCellActive, isToday && !isSelected && s.dayCellToday]}
                onPress={() => setSelectedISO(iso)}
                activeOpacity={0.7}
              >
                <Text style={[s.dayLabel, isSelected && s.dayLabelActive]}>
                  {isToday ? "TODAY" : DAY_LABELS[d.getDay()]}
                </Text>
                <Text style={[s.dayNum, isSelected && s.dayNumActive]}>{d.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Date label */}
      <View style={s.dateLabelRow}>
        {(() => {
          const d       = new Date(selectedISO + "T00:00:00");
          const isToday = selectedISO === isoDate(new Date());
          return (
            <View style={s.dateLabelLeft}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
              <Text style={s.dateLabel}>
                {isToday ? "Today — " : ""}
                {DAY_LABELS[d.getDay()]}, {d.getDate()} {MONTH_LABELS[d.getMonth()]}
              </Text>
            </View>
          );
        })()}
        <View style={s.bookingCountBadge}>
          <Text style={s.bookingCountText}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</Text>
        </View>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[s.list, bookings.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.slot}
            onPress={() => router.push(`/(worker)/bookings/${item.id}`)}
            activeOpacity={0.75}
          >
            <View style={[s.slotAccent, { backgroundColor: STATUS_LEFT_COLOR[item.status] ?? Colors.border }]} />
            <View style={s.slotTimeCol}>
              <Text style={s.slotTime}>{item.startTime}</Text>
              <View style={s.slotLine} />
              <Text style={s.slotTime}>{item.endTime}</Text>
            </View>
            <View style={s.slotBody}>
              <View style={s.slotRow}>
                <Text style={s.slotPlayer} numberOfLines={1}>{item.playerName}</Text>
                <Badge status={item.status} small />
              </View>
              {item.courtName && <Text style={s.slotCourt}>{item.courtName}</Text>}
              <View style={s.slotFooter}>
                <Text style={s.slotAmount}>{formatLKR(item.totalAmount)}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title="No bookings" sub="Nothing scheduled for this day." />
        }
      />
    </SafeAreaView>
  );
}
