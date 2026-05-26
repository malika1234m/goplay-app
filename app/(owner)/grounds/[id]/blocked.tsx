import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, ActivityIndicator, Switch, Platform, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { useBlockedDates, useAddBlockedDate, useDeleteBlockedDate } from "@/lib/queries/groundManagement";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate, formatDateShort, isoDate } from "@/lib/utils";
import type { BlockedDate } from "@/types";

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function BlockedDatesScreen() {
  const Colors = useColors();
  const { id: facilityId } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch, isRefetching } = useBlockedDates(facilityId);
  const { mutate: addBlock,    isPending: adding  } = useAddBlockedDate();
  const { mutate: deleteBlock                      } = useDeleteBlockedDate(facilityId);

  const [showModal,   setShowModal]   = useState(false);
  const [blockDate,   setBlockDate]   = useState(new Date());
  const [reason,      setReason]      = useState("");
  const [partial,     setPartial]     = useState(false);
  const [startTime,   setStartTime]   = useState("08:00");
  const [endTime,     setEndTime]     = useState("18:00");
  const [showDate,    setShowDate]    = useState(false);
  const [showStart,   setShowStart]   = useState(false);
  const [showEnd,     setShowEnd]     = useState(false);

  const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: Colors.background },
    list:        { padding: 16, paddingBottom: 120 },
    listEmpty:   { flex: 1 },

    addBtnWrap:  { marginBottom: 14 },
    addBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    addBtnText:  { fontSize: 15, fontWeight: "700", color: Colors.white },

    card:        { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLeft:    { width: 44, alignItems: "center" },
    cardBody:    { flex: 1, marginLeft: 8 },
    dateText:    { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    timeRow:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
    timeText:    { fontSize: 13, color: Colors.textMuted },
    reasonRow:   { flexDirection: "row", alignItems: "center", gap: 4 },
    reason:      { fontSize: 12, color: Colors.textSecondary, fontStyle: "italic", flex: 1 },
    removeBtn:   { padding: 4 },

    overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet:        { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "90%" },
    sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle:   { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 16 },
    fieldLabel:   { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },

    dateBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
    dateBtnText: { fontSize: 15, fontWeight: "600", color: Colors.primary },
    doneRow:     { alignItems: "flex-end", paddingVertical: 6 },
    doneText:    { fontSize: 15, fontWeight: "700", color: Colors.primary },

    partialRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    timesRow:    { flexDirection: "row", gap: 12, marginBottom: 4 },
    halfField:   { flex: 1 },
    timeBtn:     { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    timeBtnText: { fontSize: 18, fontWeight: "800", color: Colors.primary },

    input:       { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, marginBottom: 4 },

    sheetActions:   { flexDirection: "row", gap: 10, marginTop: 16 },
    cancelBtn:      { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    cancelText:     { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    confirmBtn:     { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: Colors.primary },
    confirmBtnBusy: { opacity: 0.6 },
    confirmText:    { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  const blocked  = data?.blocked ?? [];
  const upcoming = blocked.filter((b) => new Date(b.date) >= new Date(new Date().toDateString()));

  function handleAdd() {
    addBlock(
      {
        facilityId,
        date:      isoDate(blockDate),
        reason:    reason.trim() || undefined,
        startTime: partial ? startTime : undefined,
        endTime:   partial ? endTime   : undefined,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setReason(""); setPartial(false); setStartTime("08:00"); setEndTime("18:00");
        },
        onError: (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function handleDelete(b: BlockedDate) {
    Alert.alert("Remove Block", `Remove block for ${formatDate(b.date)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => deleteBlock(b.id, { onError: (e) => Alert.alert("Error", e.message) }),
      },
    ]);
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={s.container}>
      <FlatList
        data={upcoming}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[s.list, upcoming.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.88} style={s.addBtnWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={s.addBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="ban-outline" size={20} color={Colors.white} />
              <Text style={s.addBtnText}>Block a Date</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Ionicons name="calendar-clear-outline" size={32} color={Colors.error} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.dateText}>{formatDate(item.date)}</Text>
              <View style={s.timeRow}>
                <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                <Text style={s.timeText}>
                  {item.startTime && item.endTime
                    ? `${item.startTime} – ${item.endTime}`
                    : "Full day"}
                </Text>
              </View>
              {item.reason && (
                <View style={s.reasonRow}>
                  <Ionicons name="document-text-outline" size={12} color={Colors.textMuted} />
                  <Text style={s.reason} numberOfLines={1}>{item.reason}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={s.removeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="No blocked dates"
            sub="Block dates when your facility is closed for maintenance or events."
          />
        }
      />

      {/* Add block modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Block a Date</Text>

            {/* Date picker */}
            <Text style={s.fieldLabel}>DATE</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowDate(true)}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={s.dateBtnText}>{formatDateShort(isoDate(blockDate))}</Text>
            </TouchableOpacity>

            {showDate && (
              <DateTimePicker
                value={blockDate}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_, d) => { if (d) setBlockDate(d); if (Platform.OS === "android") setShowDate(false); }}
              />
            )}
            {showDate && Platform.OS === "ios" && (
              <TouchableOpacity onPress={() => setShowDate(false)} style={s.doneRow}>
                <Text style={s.doneText}>Done</Text>
              </TouchableOpacity>
            )}

            {/* Partial block toggle */}
            <View style={s.partialRow}>
              <Text style={s.fieldLabel}>PARTIAL BLOCK (TIME RANGE ONLY)</Text>
              <Switch
                value={partial}
                onValueChange={setPartial}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>

            {partial && (
              <View style={s.timesRow}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>FROM</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setShowStart(true)}>
                    <Text style={s.timeBtnText}>{startTime}</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>TO</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setShowEnd(true)}>
                    <Text style={s.timeBtnText}>{endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {showStart && (
              <DateTimePicker value={timeToDate(startTime)} mode="time" is24Hour
                onChange={(_, d) => { if (d) setStartTime(dateToTime(d)); if (Platform.OS === "android") setShowStart(false); }}
              />
            )}
            {showEnd && (
              <DateTimePicker value={timeToDate(endTime)} mode="time" is24Hour
                onChange={(_, d) => { if (d) setEndTime(dateToTime(d)); if (Platform.OS === "android") setShowEnd(false); }}
              />
            )}

            {/* Reason */}
            <Text style={[s.fieldLabel, { marginTop: 12 }]}>REASON (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Maintenance, Private event…"
              placeholderTextColor={Colors.textMuted}
              maxLength={200}
            />

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, adding && s.confirmBtnBusy]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={s.confirmText}>Block Date</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
