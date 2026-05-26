import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { useAvailability, useSaveAvailability } from "@/lib/queries/groundManagement";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { AvailabilityDay } from "@/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SCHEDULE: AvailabilityDay[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isOpen:    true,
  openTime:  "06:00",
  closeTime: "22:00",
}));

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AvailabilityScreen() {
  const Colors = useColors();
  const { id: facilityId }         = useLocalSearchParams<{ id: string }>();
  const { data, isLoading }        = useAvailability(facilityId);
  const { mutate: save, isPending} = useSaveAvailability();

  const [schedule, setSchedule] = useState<AvailabilityDay[]>(DEFAULT_SCHEDULE);
  const [picker, setPicker]     = useState<{ dayIndex: number; field: "openTime" | "closeTime" } | null>(null);

  useEffect(() => {
    if (!data?.schedule) return;
    const merged = DEFAULT_SCHEDULE.map((def) => {
      const found = data.schedule.find((d) => d.dayOfWeek === def.dayOfWeek);
      return found ?? def;
    });
    setSchedule(merged);
  }, [data]);

  const s = StyleSheet.create({
    container:      { flex: 1, backgroundColor: Colors.background },
    scroll:         { padding: 16, paddingBottom: 120 },

    hintCard:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.infoLight, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.info + "30" },
    hintText:       { fontSize: 13, color: Colors.info, flex: 1, lineHeight: 18 },

    row:            { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    rowClosed:      { opacity: 0.7 },
    dayHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    dayLeft:        { flexDirection: "row", alignItems: "center", gap: 8 },
    dayDot:         { width: 8, height: 8, borderRadius: 4 },
    dayName:        { fontSize: 15, fontWeight: "700", color: Colors.text },
    dayNameClosed:  { color: Colors.textMuted },

    times:          { flexDirection: "row", alignItems: "center" },
    timeSep:        { alignItems: "center", width: 28 },
    dash:           { fontSize: 16, color: Colors.textMuted },
    timeBtn:        { flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    timeBtnLabel:   { fontSize: 10, color: Colors.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
    timeBtnValue:   { fontSize: 18, fontWeight: "800", color: Colors.primary },

    closedPill:     { backgroundColor: Colors.background, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
    closed:         { fontSize: 13, color: Colors.textMuted, fontStyle: "italic" },

    saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, height: 52, marginTop: 8 },
    saveBtnDisabled:{ opacity: 0.6 },
    saveBtnText:    { fontSize: 16, fontWeight: "700", color: Colors.white },

    pickerDismiss:  { backgroundColor: Colors.card, paddingVertical: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border },
    pickerDone:     { fontSize: 16, fontWeight: "700", color: Colors.primary },
  });

  function toggleDay(dayIndex: number) {
    setSchedule((prev) =>
      prev.map((d) => d.dayOfWeek === dayIndex ? { ...d, isOpen: !d.isOpen } : d)
    );
  }

  function setTime(dayIndex: number, field: "openTime" | "closeTime", value: Date) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayIndex ? { ...d, [field]: dateToTime(value) } : d
      )
    );
  }

  function handleSave() {
    save(
      { facilityId, schedule },
      {
        onSuccess: () => Alert.alert("Saved", "Availability updated."),
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function TimeButton({ label, time, onPress }: { label: string; time: string; onPress: () => void }) {
    return (
      <TouchableOpacity style={s.timeBtn} onPress={onPress} activeOpacity={0.7}>
        <Text style={s.timeBtnLabel}>{label}</Text>
        <Text style={s.timeBtnValue}>{time}</Text>
      </TouchableOpacity>
    );
  }

  if (isLoading) return <LoadingScreen />;

  const activeDay = picker ? schedule.find((d) => d.dayOfWeek === picker.dayIndex) : null;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hintCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={s.hintText}>Set your opening hours for each day of the week.</Text>
        </View>

        {schedule.map((day) => (
          <View key={day.dayOfWeek} style={[s.row, !day.isOpen && s.rowClosed]}>
            {/* Day name + toggle */}
            <View style={s.dayHeader}>
              <View style={s.dayLeft}>
                <View style={[s.dayDot, { backgroundColor: day.isOpen ? Colors.primary : Colors.border }]} />
                <Text style={[s.dayName, !day.isOpen && s.dayNameClosed]}>
                  {DAY_NAMES[day.dayOfWeek]}
                </Text>
              </View>
              <Switch
                value={day.isOpen}
                onValueChange={() => toggleDay(day.dayOfWeek)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>

            {/* Times */}
            {day.isOpen ? (
              <View style={s.times}>
                <TimeButton
                  label="Opens"
                  time={day.openTime}
                  onPress={() => setPicker({ dayIndex: day.dayOfWeek, field: "openTime" })}
                />
                <View style={s.timeSep}>
                  <Text style={s.dash}>–</Text>
                </View>
                <TimeButton
                  label="Closes"
                  time={day.closeTime}
                  onPress={() => setPicker({ dayIndex: day.dayOfWeek, field: "closeTime" })}
                />
              </View>
            ) : (
              <View style={s.closedPill}>
                <Text style={s.closed}>Closed</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={handleSave} disabled={isPending} activeOpacity={0.88}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={[s.saveBtn, isPending && s.saveBtnDisabled]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={20} color={Colors.white} />
                <Text style={s.saveBtnText}>Save Availability</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Time picker */}
      {picker && activeDay && (
        <DateTimePicker
          value={timeToDate(activeDay[picker.field])}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, date) => {
            if (date) setTime(picker.dayIndex, picker.field, date);
            if (Platform.OS === "android") setPicker(null);
          }}
          onTouchCancel={() => setPicker(null)}
        />
      )}
      {picker && Platform.OS === "ios" && (
        <TouchableOpacity style={s.pickerDismiss} onPress={() => setPicker(null)}>
          <Text style={s.pickerDone}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
