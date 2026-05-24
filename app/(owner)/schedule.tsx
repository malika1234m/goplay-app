import { useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useOwnerBookings } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import { formatLKR, isoDate, addDays, sameDay } from "@/lib/utils";

const DAY_LABELS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildWeek() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => addDays(today, i));
}

export default function ScheduleScreen() {
  const Colors = useColors();
  const router  = useRouter();
  const days    = useMemo(() => buildWeek(), []);
  const [selectedISO, setSelectedISO] = useState(isoDate(days[0]));
  const [monthOpen, setMonthOpen]     = useState(false);

  const STATUS_LEFT_COLOR: Record<string, string> = {
    PENDING:   Colors.warning,
    CONFIRMED: Colors.primary,
    COMPLETED: Colors.info,
    CANCELLED: Colors.error,
    NO_SHOW:   Colors.textMuted,
  };

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },

    headerBar:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
    headerBtn:   { padding: 4 },

    dayPickerWrap:    { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, overflow: "hidden" },
    dayFade:          { position: "absolute", right: 0, top: 0, bottom: 0, width: 48, pointerEvents: "none" } as any,
    dayPickerContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
    dayCell:          { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, minWidth: 56 },
    dayCellActive:    { backgroundColor: Colors.primary },
    dayCellToday:     { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryMid },
    dayLabel:         { fontSize: 10, fontWeight: "700", color: Colors.textMuted, marginBottom: 4, letterSpacing: 0.3 },
    dayLabelActive:   { color: "rgba(255,255,255,0.8)" },
    dayNum:           { fontSize: 20, fontWeight: "800", color: Colors.text },
    dayNumActive:     { color: Colors.white },
    dot:              { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 5 },
    dotActive:        { backgroundColor: Colors.white },
    dotPlaceholder:   { width: 5, height: 5, marginTop: 5 },

    dateLabelRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
    dateLabelLeft:    { flexDirection: "row", alignItems: "center", gap: 6 },
    dateLabel:        { fontSize: 14, fontWeight: "700", color: Colors.text },
    bookingCountBadge:{ backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    bookingCountText: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },

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
    slotFacility:{ fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
    slotFooter:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    slotAmount:  { fontSize: 13, fontWeight: "700", color: Colors.primary },
  });

  const stripFrom = isoDate(days[0]);
  const stripTo   = isoDate(days[days.length - 1]);
  const { data, isLoading, refetch, isRefetching } = useOwnerBookings({
    from: selectedISO < stripFrom ? selectedISO : stripFrom,
    to:   selectedISO > stripTo   ? selectedISO : stripTo,
  });

  const bookingsForDay = useMemo(() => {
    if (!data?.bookings) return [];
    return data.bookings
      .filter((b) => sameDay(b.bookingDate, selectedISO))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data, selectedISO]);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.headerBar}>
        <Text style={s.headerTitle}>Schedule</Text>
        <TouchableOpacity onPress={() => setMonthOpen(true)} hitSlop={12} style={s.headerBtn}>
          <Ionicons name="calendar" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day picker */}
      <View style={s.dayPickerWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.dayPickerContent}
        >
          {days.map((d) => {
            const iso        = isoDate(d);
            const isSelected = iso === selectedISO;
            const isToday    = iso === isoDate(new Date());
            const count      = data?.bookings.filter((b) => sameDay(b.bookingDate, iso)).length ?? 0;
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
                <Text style={[s.dayNum, isSelected && s.dayNumActive]}>
                  {d.getDate()}
                </Text>
                {count > 0 ? (
                  <View style={[s.dot, isSelected && s.dotActive]} />
                ) : (
                  <View style={s.dotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Right fade — signals more days to scroll */}
        <LinearGradient
          colors={["rgba(255,255,255,0)", Colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.dayFade}
          pointerEvents="none"
        />
      </View>

      {/* Selected date label */}
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
          <Text style={s.bookingCountText}>
            {bookingsForDay.length} booking{bookingsForDay.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Bookings for the day */}
      <FlatList
        data={bookingsForDay}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[s.list, bookingsForDay.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.slot}
            onPress={() => router.push(`/(owner)/bookings/${item.id}`)}
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
                <Text style={s.slotPlayer} numberOfLines={1}>
                  {item.specialRequests?.startsWith("[Walk-in]")
                    ? item.specialRequests.replace("[Walk-in]", "").trim().split(" — ")[0].trim()
                    : item.user.name}
                </Text>
                <Badge status={item.status} small />
              </View>
              <Text style={s.slotFacility} numberOfLines={1}>
                {item.facility.name}{item.court ? ` · ${item.court.name}` : ""}
              </Text>
              <View style={s.slotFooter}>
                <Text style={s.slotAmount}>{formatLKR(item.totalAmount)}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No bookings"
            sub="Nothing scheduled for this day."
          />
        }
      />

      <MonthPickerModal
        visible={monthOpen}
        onClose={() => setMonthOpen(false)}
        selectedISO={selectedISO}
        onSelectDate={(iso) => { setSelectedISO(iso); setMonthOpen(false); }}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

// ─── Month picker modal ──────────────────────────────────────────────────────
function MonthPickerModal({ visible, onClose, selectedISO, onSelectDate, Colors }: {
  visible: boolean;
  onClose: () => void;
  selectedISO: string;
  onSelectDate: (iso: string) => void;
  Colors: ReturnType<typeof useColors>;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const lastOfMonth  = new Date(viewYear, viewMonth + 1, 0);

  const { data: monthData } = useOwnerBookings({
    from: isoDate(firstOfMonth),
    to:   isoDate(lastOfMonth),
  });

  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    monthData?.bookings.forEach((b) => {
      const key = b.bookingDate.slice(0, 10);
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [monthData]);

  const grid = useMemo(() => {
    const firstDow   = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const todayISO = isoDate(today);

  const m = StyleSheet.create({
    root:           { flex: 1, backgroundColor: Colors.card },
    header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    monthNav:       { flexDirection: "row", alignItems: "center", gap: 20 },
    navBtn:         { padding: 4 },
    monthLabel:     { fontSize: 18, fontWeight: "800", color: Colors.text, minWidth: 130, textAlign: "center" },
    dowRow:         { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    dowLabel:       { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },
    grid:           { paddingHorizontal: 12, paddingBottom: 32 },
    week:           { flexDirection: "row" },
    cell:           { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 14, margin: 3 },
    cellSelected:   { backgroundColor: Colors.primary },
    cellToday:      { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primaryMid },
    dayNum:         { fontSize: 17, fontWeight: "700", color: Colors.text },
    dayNumSelected: { color: Colors.white },
    dayNumToday:    { color: Colors.primary },
    dayNumPast:     { color: Colors.textMuted },
    dot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 3 },
    dotWhite:       { backgroundColor: Colors.white },
    dotPlaceholder: { width: 5, height: 5, marginTop: 3 },
    countLabel:     { fontSize: 9, fontWeight: "700", color: Colors.primary, marginTop: 1 },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={m.root} edges={["top"]}>
        {/* Header */}
        <View style={m.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={m.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={12} style={m.navBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={m.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={12} style={m.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* Day-of-week header */}
        <View style={m.dowRow}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <Text key={d} style={m.dowLabel}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <ScrollView contentContainerStyle={m.grid} showsVerticalScrollIndicator={false}>
          {grid.map((row, ri) => (
            <View key={ri} style={m.week}>
              {row.map((day, ci) => {
                if (!day) return <View key={ci} style={m.cell} />;

                const iso        = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = iso === selectedISO;
                const isToday    = iso === todayISO;
                const isPast     = iso < todayISO;
                const count      = countByDay[iso] ?? 0;

                return (
                  <TouchableOpacity
                    key={ci}
                    style={[m.cell, isSelected && m.cellSelected, isToday && !isSelected && m.cellToday]}
                    onPress={() => onSelectDate(iso)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      m.dayNum,
                      isSelected && m.dayNumSelected,
                      isToday && !isSelected && m.dayNumToday,
                      isPast && !isSelected && !isToday && m.dayNumPast,
                    ]}>
                      {day}
                    </Text>
                    {count > 0 ? (
                      <View style={[m.dot, isSelected && m.dotWhite]} />
                    ) : (
                      <View style={m.dotPlaceholder} />
                    )}
                    {count > 1 && !isSelected && (
                      <Text style={m.countLabel}>{count}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
