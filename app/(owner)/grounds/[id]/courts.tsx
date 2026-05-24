import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, ActivityIndicator, Switch, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCourts, useAddCourt, useUpdateCourt, useDeleteCourt } from "@/lib/queries/groundManagement";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import type { Court } from "@/types";

export default function CourtsScreen() {
  const Colors = useColors();
  const { id: facilityId }             = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch, isRefetching } = useCourts(facilityId);
  const { mutate: addCourt, isPending: adding }        = useAddCourt(facilityId);
  const { mutate: updateCourt, isPending: saving }     = useUpdateCourt(facilityId);
  const { mutate: deleteCourt }                        = useDeleteCourt(facilityId);

  const [showModal, setShowModal] = useState(false);
  const [newName,   setNewName]   = useState("");
  const [newDesc,   setNewDesc]   = useState("");

  const [editCourt, setEditCourt] = useState<Court | null>(null);
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");

  const courts = data?.courts ?? [];

  const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.background },
    list:         { padding: 16, paddingBottom: 32 },
    listEmpty:    { flex: 1 },

    addBtnWrap:   { marginBottom: 14 },
    addBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    addBtnText:   { fontSize: 15, fontWeight: "700", color: Colors.white },

    card:         { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: "row", overflow: "hidden" },
    cardInactive: { opacity: 0.65 },
    statusStripe: { width: 4 },
    cardContent:  { flex: 1, padding: 14 },
    cardMain:     { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    flex:         { flex: 1 },
    nameRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
    courtName:    { fontSize: 15, fontWeight: "700", color: Colors.text },
    nameInactive: { textDecorationLine: "line-through", color: Colors.textMuted },
    inactiveBadge:{ backgroundColor: Colors.background, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    inactiveBadgeText:{ fontSize: 10, fontWeight: "600", color: Colors.textMuted },
    courtDesc:    { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
    bookingRow:   { flexDirection: "row", alignItems: "center", gap: 3 },
    bookingCount: { fontSize: 11, color: Colors.textMuted },
    cardActions:  { flexDirection: "row", alignSelf: "flex-end", gap: 16 },
    editBtn:      { flexDirection: "row", alignItems: "center", gap: 4 },
    editText:     { fontSize: 13, color: Colors.primary, fontWeight: "600" },
    deleteBtn:    { flexDirection: "row", alignItems: "center", gap: 4 },
    deleteText:   { fontSize: 13, color: Colors.error, fontWeight: "600" },

    overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet:         { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle:    { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 20 },
    fieldLabel:    { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    input:         { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, marginBottom: 16 },
    sheetActions:  { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelBtn:     { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    cancelText:    { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    confirmBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: Colors.primary },
    confirmBtnBusy:{ opacity: 0.6 },
    confirmText:   { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  function handleAdd() {
    if (!newName.trim()) return Alert.alert("Validation", "Court name is required.");
    addCourt(
      { name: newName.trim(), description: newDesc.trim() || undefined },
      {
        onSuccess: () => { setShowModal(false); setNewName(""); setNewDesc(""); },
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function openEdit(court: Court) {
    setEditCourt(court);
    setEditName(court.name);
    setEditDesc(court.description ?? "");
  }

  function handleEditSave() {
    if (!editCourt || !editName.trim()) return Alert.alert("Validation", "Court name is required.");
    updateCourt(
      { courtId: editCourt.id, name: editName.trim(), description: editDesc.trim() || undefined },
      {
        onSuccess: () => setEditCourt(null),
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function handleToggle(court: Court) {
    updateCourt(
      { courtId: court.id, isActive: !court.isActive },
      { onError: (e) => Alert.alert("Error", e.message) }
    );
  }

  function handleDelete(court: Court) {
    Alert.alert(
      "Delete Court",
      `Delete "${court.name}"? This cannot be undone.\n\nNote: courts with active bookings cannot be deleted — deactivate them instead.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: () =>
            deleteCourt(court.id, { onError: (e) => Alert.alert("Error", e.message) }),
        },
      ]
    );
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={s.container}>
      <FlatList
        data={courts}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[s.list, courts.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={[s.card, !item.isActive && s.cardInactive]}>
            <View style={[s.statusStripe, { backgroundColor: item.isActive ? Colors.primary : Colors.border }]} />
            <View style={s.cardContent}>
              <View style={s.cardMain}>
                <View style={s.flex}>
                  <View style={s.nameRow}>
                    <Text style={[s.courtName, !item.isActive && s.nameInactive]}>{item.name}</Text>
                    {!item.isActive && (
                      <View style={s.inactiveBadge}>
                        <Text style={s.inactiveBadgeText}>Inactive</Text>
                      </View>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={s.courtDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={s.bookingRow}>
                    <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
                    <Text style={s.bookingCount}>{item._count.bookings} bookings</Text>
                  </View>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item)}
                  trackColor={{ true: Colors.primary, false: Colors.border }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="create-outline" size={14} color={Colors.primary} />
                  <Text style={s.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.error} />
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.88} style={s.addBtnWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={s.addBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Text style={s.addBtnText}>Add Court</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <EmptyState icon="tennisball-outline" title="No courts" sub="Add courts to allow court-specific bookings." />
        }
      />

      {/* Edit Court Modal */}
      <Modal visible={!!editCourt} transparent animationType="slide" onRequestClose={() => setEditCourt(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Edit Court</Text>

            <Text style={s.fieldLabel}>COURT NAME *</Text>
            <TextInput
              style={s.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Court A"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={s.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="e.g. Synthetic turf, indoor"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditCourt(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, saving && s.confirmBtnBusy]}
                onPress={handleEditSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={s.confirmText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Court Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>New Court</Text>

            <Text style={s.fieldLabel}>COURT NAME *</Text>
            <TextInput
              style={s.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Court A"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={s.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="e.g. Synthetic turf, indoor"
              placeholderTextColor={Colors.textMuted}
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
                  : <Text style={s.confirmText}>Add Court</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
