import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useWorkers, useAddWorker, useRemoveWorker } from "@/lib/queries/workers";
import { useColors } from "@/lib/theme";
import { useKeyboardPadding } from "@/lib/keyboard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { Worker } from "@/types";
import { useT } from "@/lib/i18n/I18nProvider";

export default function WorkersScreen() {
  const { t } = useT();
  const Colors = useColors();
  const keyboardPad = useKeyboardPadding();
  const { id: facilityId } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch, isRefetching } = useWorkers(facilityId);
  const { mutate: addWorker,    isPending: adding   } = useAddWorker();
  const { mutate: removeWorker, isPending: removing } = useRemoveWorker(facilityId);

  const [showModal, setShowModal] = useState(false);
  const [email,     setEmail]     = useState("");
  const [workerName,setWorkerName]= useState("");

  const AVATAR_COLORS = [Colors.primary, "#0891b2", "#8b5cf6", "#d97706", "#dc2626"];

  const s = StyleSheet.create({
    container:  { flex: 1, backgroundColor: Colors.background },
    list:       { padding: 16, paddingBottom: 120 },
    listEmpty:  { flex: 1 },

    addBtnWrap: { marginBottom: 10 },
    addBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    addBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

    hintCard:   { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: Colors.infoLight, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.info + "30" },
    hint:       { fontSize: 12, color: Colors.info, lineHeight: 18, flex: 1 },

    card:       { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    avatarBox:  { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: 1.5 },
    avatarText: { fontSize: 20, fontWeight: "800" },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 3 },
    workerEmailRow:{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
    workerEmail:{ fontSize: 12, color: Colors.textMuted },
    workerDateRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    workerJoined:{ fontSize: 11, color: Colors.textMuted },
    removeBtn:  { flexDirection: "row", alignItems: "center", gap: 3 },
    removeText: { fontSize: 12, fontWeight: "600", color: Colors.error },

    overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet:        { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle:   { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 6 },
    sheetSub:     { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 20 },
    fieldLabel:   { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16 },
    inputIcon:    { marginRight: 8 },
    input:        { flex: 1, fontSize: 15, color: Colors.text },
    sheetActions: { flexDirection: "row", gap: 10 },
    cancelBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    cancelText:   { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    confirmBtn:   { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: Colors.primary },
    confirmBtnBusy:{ opacity: 0.6 },
    confirmText:  { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  const workers = data?.workers ?? [];

  function handleAdd() {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) return Alert.alert(t("Validation"), t("Email address is required."));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      return Alert.alert(t("Validation"), t("Enter a valid email address."));
    }
    const trimName = workerName.trim();
    if (trimName && (trimName.length < 2 || trimName.length > 50)) {
      return Alert.alert(t("Validation"), t("Worker name must be 2–50 characters."));
    }

    addWorker(
      { facilityId, email: trimEmail, name: trimName || undefined },
      {
        onSuccess: (res) => {
          setShowModal(false);
          setEmail("");
          setWorkerName("");

          if (res.isNewAccount && res.tempPassword) {
            Alert.alert(
              t("Worker Account Created"),
              t("A new account was created for {name}.\n\nTemporary password:\n\n{password}\n\nShare this with the worker. They will be asked to change it on first login.", { name: res.worker.name, password: res.tempPassword }),
              [{ text: t("Got it") }]
            );
          } else {
            Alert.alert(t("Added"), `${res.worker.name} has been added as a worker.`);
          }
        },
        onError: (e) => Alert.alert(t("Error"), e.message),
      }
    );
  }

  function handleRemove(worker: Worker) {
    Alert.alert(
      t("Remove Worker"),
      t("Remove {name} from this facility?\n\nThey will lose access to the worker dashboard.", { name: worker.name }),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Remove"), style: "destructive",
          onPress: () =>
            removeWorker(worker.id, {
              onSuccess: () => Alert.alert(t("Removed"), `${worker.name} has been removed.`),
              onError:   (e) => Alert.alert(t("Error"), e.message),
            }),
        },
      ]
    );
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={s.container}>
      <FlatList
        data={workers}
        keyExtractor={(w) => w.id}
        contentContainerStyle={[s.list, workers.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.88} style={s.addBtnWrap}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={s.addBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
                <Text style={s.addBtnText}>{t("Add Worker")}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={s.hintCard}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
              <Text style={s.hint}>
                {t("Workers can view bookings, manage schedules, and create walk-in bookings for this facility.")}
              </Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return (
            <View style={s.card}>
              <View style={[s.avatarBox, { backgroundColor: avatarColor + "20", borderColor: avatarColor + "40" }]}>
                <Text style={[s.avatarText, { color: avatarColor }]}>
                  {item.name[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={s.workerInfo}>
                <Text style={s.workerName}>{item.name}</Text>
                <View style={s.workerEmailRow}>
                  <Ionicons name="mail-outline" size={11} color={Colors.textMuted} />
                  <Text style={s.workerEmail}>{item.email}</Text>
                </View>
                <View style={s.workerDateRow}>
                  <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
                  <Text style={s.workerJoined}>Added {formatDate(item.joinedAt)}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                disabled={removing}
                style={s.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="person-remove-outline" size={16} color={Colors.error} />
                <Text style={s.removeText}>{removing ? "…" : t("Remove")}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t("No workers yet")}
            sub={t("Add workers to let them manage bookings at this facility.")}
          />
        }
      />

      {/* Add Worker Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, keyboardPad > 0 && { paddingBottom: keyboardPad }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{t("Add Worker")}</Text>
            <Text style={s.sheetSub}>
              {t("Enter their email address. If they don't have an account, one will be created automatically.")}
            </Text>

            <Text style={s.fieldLabel}>{t("EMAIL ADDRESS *")}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t("worker@example.com")}
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <Text style={s.fieldLabel}>{t("NAME (IF NEW ACCOUNT)")}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={workerName}
                onChangeText={setWorkerName}
                placeholder={t("Worker's full name")}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>{t("Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, adding && s.confirmBtnBusy]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={s.confirmText}>{t("Add Worker")}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
