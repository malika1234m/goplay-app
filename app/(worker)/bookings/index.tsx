import { useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, RefreshControl, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useWorkerBookings, useCreateWalkIn, useWorkerFacility } from "@/lib/queries/worker";
import { useColors } from "@/lib/theme";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatDate, formatLKR, isoDate } from "@/lib/utils";
import type { BookingStatus } from "@/types";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "HISTORY";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL",       label: "Active"    },
  { key: "PENDING",   label: "Pending"   },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "HISTORY",   label: "History"   },
];

function dateToTime(d: Date) {
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function timeToDate(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}

export default function WorkerBookingsList() {
  const Colors = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const isHistory = filter === "HISTORY";

  const { data, isLoading, refetch, isRefetching } = useWorkerBookings(
    isHistory         ? { history: true } :
    filter !== "ALL"  ? { status: filter as BookingStatus } :
    {}
  );
  const { data: facilityData } = useWorkerFacility();
  const { mutate: createWalkIn, isPending: creating } = useCreateWalkIn();

  const allBookings = data?.bookings ?? [];
  const courts      = facilityData?.facility?.courts ?? [];

  const bookings = useMemo(() => {
    if (!search.trim()) return allBookings;
    const q = search.trim().toLowerCase();
    return allBookings.filter(
      (b) => b.playerName.toLowerCase().includes(q) || (b.courtName ?? "").toLowerCase().includes(q)
    );
  }, [allBookings, search]);

  // Walk-in form state
  const [showModal,   setShowModal]   = useState(false);
  const [playerName,  setPlayerName]  = useState("");
  const [contactNum,  setContactNum]  = useState("");
  const [notes,       setNotes]       = useState("");
  const [courtId,     setCourtId]     = useState<string>("");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [startTime,   setStartTime]   = useState("08:00");
  const [endTime,     setEndTime]     = useState("09:00");
  const [showDate,    setShowDate]    = useState(false);
  const [showStart,   setShowStart]   = useState(false);
  const [showEnd,     setShowEnd]     = useState(false);

  const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: Colors.background },
    filterWrap:  { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    filterList:  { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    chipActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText:    { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    chipTextActive: { color: Colors.white },
    searchWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, height: 44 },
    searchIcon:  { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text },
    list:        { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 },
    listEmpty:   { flex: 1 },
    walkInWrap:    { marginBottom: 12 },
    walkInBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    walkInBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
    card:       { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    flex:       { flex: 1, marginRight: 8 },
    mt6:        { marginTop: 6 },
    playerName: { fontSize: 15, fontWeight: "700", color: Colors.text },
    courtName:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    time:       { fontSize: 13, fontWeight: "600", color: Colors.text, marginLeft: 4 },
    sep:        { width: 8 },
    dateText:   { fontSize: 13, color: Colors.textMuted, marginLeft: 4 },
    amount:     { fontSize: 14, fontWeight: "700", color: Colors.primary },
    overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet:        { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: "92%" },
    sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle:   { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 16 },
    label:        { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, marginTop: 12 },
    inputWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 4 },
    inputIcon:    { marginRight: 8 },
    input:        { flex: 1, fontSize: 15, color: Colors.text },
    inputDirect:  { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.text, marginBottom: 4 },
    inputMultiline:{ height: 72, paddingTop: 11 },
    pickerBtn:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
    pickerBtnText:{ fontSize: 15, fontWeight: "600", color: Colors.primary },
    doneRow:      { alignItems: "flex-end", paddingVertical: 4 },
    doneText:     { fontSize: 14, fontWeight: "700", color: Colors.primary },
    timeRow:      { flexDirection: "row", gap: 10 },
    halfField:    { flex: 1 },
    courtRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    courtChip:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
    courtChipActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
    courtChipText:     { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    courtChipTextActive:{ color: Colors.white },
    sheetActions: { flexDirection: "row", gap: 10, marginTop: 16 },
    cancelBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    cancelText:   { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    confirmBtn:   { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: Colors.primary },
    confirmBtnBusy:{ opacity: 0.6 },
    confirmText:  { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  if (isLoading) return (
    <View style={s.container}>
      <View style={s.filterWrap}>
        <FlatList data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(f) => f.key} contentContainerStyle={s.filterList} renderItem={({ item }) => (
          <View style={[s.chip, filter === item.key && s.chipActive]}><Text style={[s.chipText, filter === item.key && s.chipTextActive]}>{item.label}</Text></View>
        )} />
      </View>
      <SkeletonList count={5} />
    </View>
  );

  function openModal() {
    setPlayerName(""); setContactNum(""); setNotes("");
    setBookingDate(new Date()); setStartTime("08:00"); setEndTime("09:00");
    setCourtId(courts[0]?.id ?? "");
    setShowModal(true);
  }

  function handleCreate() {
    if (!playerName.trim())   return Alert.alert("Validation", "Player name is required.");
    if (startTime >= endTime) return Alert.alert("Validation", "End time must be after start time.");
    if (courts.length > 0 && !courtId) return Alert.alert("Validation", "Please select a court.");

    createWalkIn(
      {
        courtId:         courtId || undefined,
        bookingDate:     isoDate(bookingDate),
        startTime,
        endTime,
        playerName:      playerName.trim(),
        contactNumber:   contactNum.trim() || undefined,
        specialRequests: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowModal(false);
          Alert.alert("Created", "Walk-in booking created.");
        },
        onError: (e) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Error", e.message);
        },
      }
    );
  }

  return (
    <View style={s.container}>
      {/* Filter pills */}
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
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[s.list, bookings.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <TouchableOpacity onPress={openModal} activeOpacity={0.88} style={s.walkInWrap}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.walkInBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Text style={s.walkInBtnText}>Walk-in Booking</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/(worker)/bookings/${item.id}`)} activeOpacity={0.75}>
            <View style={s.cardRow}>
              <View style={s.flex}>
                <Text style={s.playerName}>{item.playerName}</Text>
                {item.courtName && <Text style={s.courtName}>{item.courtName}</Text>}
              </View>
              <Badge status={item.status} />
            </View>
            <View style={[s.cardRow, s.mt6]}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={s.time}>{item.startTime} – {item.endTime}</Text>
              <View style={s.sep} />
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={s.dateText}>{formatDate(item.bookingDate)}</Text>
            </View>
            <View style={[s.cardRow, s.mt6]}>
              <Text style={s.amount}>{formatLKR(item.totalAmount)}</Text>
              <Badge method={item.paymentMethod} small />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          search.trim() ? (
            <EmptyState icon="search-outline" title="No results" sub={`No bookings match "${search}".`} />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No bookings"
              sub={isHistory ? "No past bookings." : "Bookings will appear here."}
            />
          )
        }
      />

      {/* Walk-in Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.sheetTitle}>Walk-in Booking</Text>

              <Text style={s.label}>PLAYER NAME *</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput style={s.input} value={playerName} onChangeText={setPlayerName} placeholder="Full name" placeholderTextColor={Colors.textMuted} autoFocus />
              </View>

              <Text style={s.label}>DATE *</Text>
              <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={s.pickerBtnText}>{bookingDate.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</Text>
              </TouchableOpacity>
              {showDate && (
                <DateTimePicker value={bookingDate} mode="date" minimumDate={new Date()} display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_, d) => { if (d) setBookingDate(d); if (Platform.OS === "android") setShowDate(false); }}
                />
              )}
              {showDate && Platform.OS === "ios" && (
                <TouchableOpacity onPress={() => setShowDate(false)} style={s.doneRow}>
                  <Text style={s.doneText}>Done</Text>
                </TouchableOpacity>
              )}

              <View style={s.timeRow}>
                <View style={s.halfField}>
                  <Text style={s.label}>START *</Text>
                  <TouchableOpacity style={s.pickerBtn} onPress={() => setShowStart(true)}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={s.pickerBtnText}>{startTime}</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.halfField}>
                  <Text style={s.label}>END *</Text>
                  <TouchableOpacity style={s.pickerBtn} onPress={() => setShowEnd(true)}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={s.pickerBtnText}>{endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {showStart && (
                <DateTimePicker value={timeToDate(startTime)} mode="time" is24Hour onChange={(_, d) => { if (d) setStartTime(dateToTime(d)); if (Platform.OS === "android") setShowStart(false); }} />
              )}
              {showEnd && (
                <DateTimePicker value={timeToDate(endTime)} mode="time" is24Hour onChange={(_, d) => { if (d) setEndTime(dateToTime(d)); if (Platform.OS === "android") setShowEnd(false); }} />
              )}

              {courts.length > 0 && (
                <>
                  <Text style={s.label}>COURT *</Text>
                  <View style={s.courtRow}>
                    {courts.map((c) => (
                      <TouchableOpacity key={c.id} style={[s.courtChip, courtId === c.id && s.courtChipActive]} onPress={() => setCourtId(c.id)} activeOpacity={0.7}>
                        <Text style={[s.courtChipText, courtId === c.id && s.courtChipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={s.label}>CONTACT NUMBER</Text>
              <View style={s.inputWrap}>
                <Ionicons name="call-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput style={s.input} value={contactNum} onChangeText={setContactNum} placeholder="077 123 4567" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
              </View>

              <Text style={s.label}>NOTES</Text>
              <TextInput style={[s.inputDirect, s.inputMultiline]} value={notes} onChangeText={setNotes} placeholder="Any special requests…" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} textAlignVertical="top" />

              <View style={s.sheetActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.confirmBtn, creating && s.confirmBtnBusy]} onPress={handleCreate} disabled={creating}>
                  {creating ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.confirmText}>Create Booking</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
