import { useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  TextInput, Modal, ScrollView, Alert, ActivityIndicator, Platform, Pressable, Animated,
} from "react-native";
import type { Booking } from "@/types";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useOwnerBookings, useOwnerGrounds, useGroundCourts, useCreateOwnerWalkIn } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import BookingCard from "@/components/bookings/BookingCard";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { isoDate } from "@/lib/utils";
import type { BookingStatus } from "@/types";

type ListItem =
  | { type: "header"; title: string; subtitle: string; color: string }
  | { type: "booking"; booking: Booking };

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3, NO_SHOW: 4,
};

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "HISTORY";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL",       label: "Active"    },
  { key: "PENDING",   label: "Pending"   },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "HISTORY",   label: "History"   },
];

export default function BookingsList() {
  const Colors = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);

  const isHistory = filter === "HISTORY";

  const { data, isLoading, refetch, isRefetching, error } = useOwnerBookings(
    isHistory
      ? { history: true }
      : filter !== "ALL"
      ? { status: filter as BookingStatus }
      : {}
  );

  const listItems = useMemo((): ListItem[] => {
    let all = data?.bookings ?? [];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      all = all.filter(
        (b) =>
          b.user.name.toLowerCase().includes(q) ||
          (b.court?.name ?? "").toLowerCase().includes(q) ||
          b.facility.name.toLowerCase().includes(q)
      );
    }

    // Non-ALL filters: just sort by date descending, no sections
    if (filter !== "ALL") {
      return [...all]
        .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
        .map((booking) => ({ type: "booking" as const, booking }));
    }

    // ALL view: sort by priority, then split into sections
    const sorted = [...all].sort(
      (a, b) => (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5)
    );

    const needsAction = sorted.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");
    const done        = sorted.filter((b) => b.status !== "PENDING" && b.status !== "CONFIRMED");

    const items: ListItem[] = [];

    if (needsAction.length > 0) {
      items.push({
        type:     "header",
        title:    "Needs Action",
        subtitle: `${needsAction.filter(b => b.status === "PENDING").length} to confirm · ${needsAction.filter(b => b.status === "CONFIRMED").length} to complete`,
        color:    "#f59e0b",
      });
      needsAction.forEach((booking) => items.push({ type: "booking", booking }));
    }

    if (done.length > 0) {
      items.push({
        type:     "header",
        title:    "Done",
        subtitle: `${done.length} booking${done.length !== 1 ? "s" : ""}`,
        color:    "#64748b",
      });
      done.forEach((booking) => items.push({ type: "booking", booking }));
    }

    return items;
  }, [data, search, filter]);

  const bookingCount = listItems.filter((i) => i.type === "booking").length;

  const s = StyleSheet.create({
    container:      { flex: 1, backgroundColor: Colors.background },
    filterWrap:     { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    filterList:     { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText:       { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    chipTextActive: { color: Colors.white },
    searchWrap:     { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, height: 44 },
    searchIcon:     { marginRight: 8 },
    searchInput:    { flex: 1, fontSize: 14, color: Colors.text },
    list:           { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
    listEmpty:      { flex: 1 },
    footer:         { paddingVertical: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card },
    footerText:     { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
    fab:            { position: "absolute", right: 20, bottom: 100, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 28, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
    fabText:        { color: Colors.white, fontSize: 15, fontWeight: "700" },
    sectionHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 4, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: Colors.border },
    sectionTitle:   { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
    sectionSub:     { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  });

  const filterBar = (
    <View style={s.filterWrap}>
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f.key}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, filter === item.key && s.chipActive]}
            onPress={() => setFilter(item.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, filter === item.key && s.chipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (isLoading) return (
    <View style={s.container}>
      {filterBar}
      <SkeletonList count={5} />
    </View>
  );

  return (
    <View style={s.container}>
      {filterBar}

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by player or court…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Booking list */}
      <FlatList
        data={listItems}
        keyExtractor={(item, i) =>
          item.type === "header" ? `header-${i}` : item.booking.id
        }
        contentContainerStyle={[s.list, listItems.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={[s.sectionHeader, { borderLeftColor: item.color }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { color: item.color }]}>{item.title}</Text>
                  <Text style={s.sectionSub}>{item.subtitle}</Text>
                </View>
              </View>
            );
          }
          return (
            <BookingCard
              booking={item.booking}
              onPress={() => router.push(`/(owner)/bookings/${item.booking.id}`)}
            />
          );
        }}
        ListEmptyComponent={
          error ? (
            <EmptyState icon="alert-circle-outline" title="Failed to load bookings" sub="Pull down to retry." />
          ) : search.trim() ? (
            <EmptyState icon="search-outline" title="No results" sub={`No bookings match "${search}".`} />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No bookings found"
              sub={filter === "HISTORY" ? "No past bookings in this range." : "Bookings will appear here once created."}
            />
          )
        }
      />

      {/* Count footer */}
      {bookingCount > 0 && (
        <View style={s.footer}>
          <Text style={s.footerText}>
            {bookingCount} booking{bookingCount !== 1 ? "s" : ""}
            {data?.total && data.total > bookingCount ? ` of ${data.total}` : ""}
          </Text>
        </View>
      )}

      {/* Walk-in FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setWalkInOpen(true); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color={Colors.white} />
        <Text style={s.fabText}>Walk-in</Text>
      </TouchableOpacity>

      <WalkInModal visible={walkInOpen} onClose={() => setWalkInOpen(false)} Colors={Colors} />
    </View>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────
function timeToDate(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function dateToTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── Walk-in modal ───────────────────────────────────────────────────────────
function WalkInModal({ visible, onClose, Colors }: { visible: boolean; onClose: () => void; Colors: ReturnType<typeof useColors> }) {
  const { data: groundsData } = useOwnerGrounds();
  const grounds = groundsData?.grounds?.filter((g) => g.status === "ACTIVE") ?? [];

  const [facilityId,     setFacilityId]     = useState<string>("");
  const [courtId,        setCourtId]        = useState<string>("");
  const [playerName,     setPlayerName]     = useState("");
  const [contactNumber,  setContactNumber]  = useState("");
  const [notes,          setNotes]          = useState("");
  const [bookingDate,    setBookingDate]    = useState(new Date());
  const [startTime,      setStartTime]      = useState("08:00");
  const [endTime,        setEndTime]        = useState("09:00");
  const [showDate,       setShowDate]       = useState(false);
  const [showStart,      setShowStart]      = useState(false);
  const [showEnd,        setShowEnd]        = useState(false);

  // Auto-select first ground if only one
  const resolvedFacilityId = facilityId || grounds[0]?.id || "";
  const { data: courtsData } = useGroundCourts(resolvedFacilityId || null);
  const courts = courtsData?.courts?.filter((c) => c.isActive) ?? [];

  const { mutate: createWalkIn, isPending: creating } = useCreateOwnerWalkIn();

  function reset() {
    setFacilityId(""); setCourtId(""); setPlayerName("");
    setContactNumber(""); setNotes("");
    setBookingDate(new Date()); setStartTime("08:00"); setEndTime("09:00");
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit() {
    if (!playerName.trim())      return Alert.alert("Required", "Player name is required.");
    if (!resolvedFacilityId)     return Alert.alert("Required", "Please select a facility.");
    if (courts.length > 0 && !courtId) return Alert.alert("Required", "Please select a court.");
    if (startTime >= endTime)    return Alert.alert("Invalid Time", "End time must be after start time.");

    createWalkIn(
      {
        facilityId:    resolvedFacilityId,
        courtId:       courtId || null,
        bookingDate:   isoDate(bookingDate),
        startTime,
        endTime,
        playerName:    playerName.trim(),
        contactNumber: contactNumber.trim() || undefined,
        notes:         notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Booked!", `Walk-in for ${playerName.trim()} confirmed.`);
          handleClose();
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  }

  const selectedGround = grounds.find((g) => g.id === resolvedFacilityId);

  const w = StyleSheet.create({
    root:           { flex: 1, backgroundColor: Colors.card },
    header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title:          { fontSize: 17, fontWeight: "800", color: Colors.text },
    body:           { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 4 },
    field:          { marginBottom: 14 },
    fieldLabel:     { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
    fieldLabelText: { fontSize: 12, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    input:          { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
    inputMulti:     { height: 88, textAlignVertical: "top", paddingTop: 12 },
    pickerBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    pickerBtnText:  { fontSize: 15, color: Colors.text, fontWeight: "500" },
    segmentRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    seg:            { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    segActive:      { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
    segText:        { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    segTextActive:  { color: Colors.primary },
    timeRow:        { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    costPreview:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
    costText:       { fontSize: 14, fontWeight: "600", color: Colors.primary },
    footer:         { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
    submitBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 16 },
    submitBusy:     { opacity: 0.65 },
    submitText:     { fontSize: 16, fontWeight: "800", color: Colors.white },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={w.root}>
        {/* Header */}
        <View style={w.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={w.title}>Walk-in / Phone Booking</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={w.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Facility selector (only show if multiple grounds) */}
          {grounds.length > 1 && (
            <View style={w.field}>
              <View style={w.fieldLabel}>
                <Ionicons name="business-outline" size={13} color={Colors.textMuted} />
                <Text style={w.fieldLabelText}>Facility</Text>
              </View>
              <View style={w.segmentRow}>
                {grounds.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[w.seg, resolvedFacilityId === g.id && w.segActive]}
                    onPress={() => { setFacilityId(g.id); setCourtId(""); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[w.segText, resolvedFacilityId === g.id && w.segTextActive]} numberOfLines={1}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Court selector */}
          {courts.length > 0 && (
            <View style={w.field}>
              <View style={w.fieldLabel}>
                <Ionicons name="grid-outline" size={13} color={Colors.textMuted} />
                <Text style={w.fieldLabelText}>Court</Text>
              </View>
              <View style={w.segmentRow}>
                {courts.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[w.seg, courtId === c.id && w.segActive]}
                    onPress={() => setCourtId(c.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[w.segText, courtId === c.id && w.segTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Date */}
          <View style={w.field}>
            <View style={w.fieldLabel}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={w.fieldLabelText}>Date</Text>
            </View>
            <TouchableOpacity style={w.pickerBtn} onPress={() => setShowDate(true)} activeOpacity={0.8}>
              <Text style={w.pickerBtnText}>
                {bookingDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showDate && (
              <DateTimePicker
                value={bookingDate}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_, d) => { if (d) setBookingDate(d); if (Platform.OS === "android") setShowDate(false); }}
              />
            )}
          </View>

          {/* Time row */}
          <View style={w.timeRow}>
            <View style={{ flex: 1 }}>
              <View style={w.field}>
                <View style={w.fieldLabel}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={w.fieldLabelText}>Start Time</Text>
                </View>
                <TouchableOpacity style={w.pickerBtn} onPress={() => setShowStart(true)} activeOpacity={0.8}>
                  <Text style={w.pickerBtnText}>{startTime}</Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
                {showStart && (
                  <DateTimePicker
                    value={timeToDate(startTime)}
                    mode="time"
                    is24Hour
                    onChange={(_, d) => { if (d) setStartTime(dateToTime(d)); if (Platform.OS === "android") setShowStart(false); }}
                  />
                )}
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} style={{ marginTop: 32 }} />
            <View style={{ flex: 1 }}>
              <View style={w.field}>
                <View style={w.fieldLabel}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={w.fieldLabelText}>End Time</Text>
                </View>
                <TouchableOpacity style={w.pickerBtn} onPress={() => setShowEnd(true)} activeOpacity={0.8}>
                  <Text style={w.pickerBtnText}>{endTime}</Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
                {showEnd && (
                  <DateTimePicker
                    value={timeToDate(endTime)}
                    mode="time"
                    is24Hour
                    onChange={(_, d) => { if (d) setEndTime(dateToTime(d)); if (Platform.OS === "android") setShowEnd(false); }}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Cost preview */}
          {selectedGround && startTime < endTime && (
            <View style={w.costPreview}>
              <Ionicons name="cash-outline" size={15} color={Colors.primary} />
              <Text style={w.costText}>
                {(() => {
                  const [sh, sm] = startTime.split(":").map(Number);
                  const [eh, em] = endTime.split(":").map(Number);
                  const hrs = (eh * 60 + em - (sh * 60 + sm)) / 60;
                  return `${hrs}h × Rs. ${selectedGround.hourlyRate.toLocaleString()} = Rs. ${(hrs * selectedGround.hourlyRate).toLocaleString()}`;
                })()}
              </Text>
            </View>
          )}

          {/* Player name */}
          <View style={w.field}>
            <View style={w.fieldLabel}>
              <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
              <Text style={w.fieldLabelText}>Player Name</Text>
            </View>
            <TextInput
              style={w.input}
              placeholder="Enter player name"
              placeholderTextColor={Colors.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              returnKeyType="next"
            />
          </View>

          {/* Contact number */}
          <View style={w.field}>
            <View style={w.fieldLabel}>
              <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
              <Text style={w.fieldLabelText}>Phone Number (optional)</Text>
            </View>
            <TextInput
              style={w.input}
              placeholder="077 123 4567"
              placeholderTextColor={Colors.textMuted}
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Notes */}
          <View style={w.field}>
            <View style={w.fieldLabel}>
              <Ionicons name="document-text-outline" size={13} color={Colors.textMuted} />
              <Text style={w.fieldLabelText}>Notes (optional)</Text>
            </View>
            <TextInput
              style={[w.input, w.inputMulti]}
              placeholder="Any special requests or notes…"
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={w.footer}>
          <TouchableOpacity
            style={[w.submitBtn, creating && w.submitBusy]}
            onPress={handleSubmit}
            disabled={creating}
            activeOpacity={0.85}
          >
            {creating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={w.submitText}>Confirm Walk-in Booking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
