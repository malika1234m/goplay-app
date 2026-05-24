import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGround, useUpdateGround, useCategories, useUploadGroundImages } from "@/lib/queries/groundManagement";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { FacilityStatus } from "@/types";

const STATUS_META: Record<FacilityStatus, { color: string; bg: string; icon: string; msg: string }> = {
  PENDING:  { color: "#d97706", bg: "#fef3c7", icon: "time-outline",            msg: "Under review — details can still be edited while waiting for approval." },
  ACTIVE:   { color: "#16a34a", bg: "#dcfce7", icon: "checkmark-circle-outline", msg: "Your ground is live and visible to players." },
  INACTIVE: { color: "#64748b", bg: "#f1f5f9", icon: "pause-circle-outline",    msg: "Your ground is inactive and hidden from players." },
  REJECTED: { color: "#dc2626", bg: "#fee2e2", icon: "close-circle-outline",    msg: "Ground was rejected. Update details and contact support." },
};

const AMENITIES = [
  "Parking", "Changing Rooms", "Showers", "Toilets", "Floodlights",
  "Equipment Rental", "Cafeteria", "WiFi", "First Aid Kit", "Covered Area",
  "Lockers", "Water Supply", "Security Guard", "CCTV",
];

export default function EditGround() {
  const Colors = useColors();
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();

  const { data: groundData, isLoading } = useGround(id);
  const { data: catData }               = useCategories();
  const { mutate: save, isPending }     = useUpdateGround(id);
  const { mutate: uploadImgs, isPending: uploading } = useUploadGroundImages();

  const g = groundData?.ground;

  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("");
  const [hourlyRate,  setHourlyRate]  = useState("");
  const [capacity,    setCapacity]    = useState("");
  const [amenities,   setAmenities]   = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [images,      setImages]      = useState<string[]>([]);

  useEffect(() => {
    if (!g) return;
    setName(g.name);
    setDescription(g.description ?? "");
    setAddress(g.address);
    setCity(g.city);
    setHourlyRate(String(g.hourlyRate));
    setCapacity(g.capacity ? String(g.capacity) : "");
    setAmenities(g.amenities);
    setCategoryIds(g.categories.map((c) => c.id));
    setImages(g.images ?? []);
  }, [g]);

  const s = StyleSheet.create({
    scroll:  { padding: 16, paddingBottom: 48 },
    row:     { flexDirection: "row", gap: 10 },
    halfLeft:{ flex: 1 },
    halfRight:{ flex: 1 },

    statusBanner:   { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
    statusBannerText:{ flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18 },

    section:       { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
    sectionLabel:  { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },

    field:          { marginBottom: 12 },
    fieldLabel:     { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
    inputWrap:      { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 48 },
    inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: Colors.card },
    inputWrapMultiline:{ alignItems: "flex-start", paddingTop: 10 },
    inputIcon:      { marginRight: 8 },
    input:          { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 0 },
    inputMultiline: { minHeight: 72, paddingTop: 2 },

    chipWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    chipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText:      { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    chipTextActive:{ color: Colors.white },

    imgGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    imgCell:   { width: 88, height: 88, borderRadius: 10, overflow: "visible" },
    imgThumb:  { width: 88, height: 88, borderRadius: 10 },
    imgRemove: { position: "absolute", top: -8, right: -8, zIndex: 1 },
    imgAdd:    { width: 88, height: 88, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
    imgAddText:{ fontSize: 11, fontWeight: "600", color: Colors.primary },

    saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, height: 52 },
    saveBtnDisabled:{ opacity: 0.6 },
    saveBtnText:    { fontSize: 16, fontWeight: "700", color: Colors.white },
  });

  if (isLoading) return <LoadingScreen />;

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow photo library access to add images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 8 - images.length,
      quality: 0.85,
    });
    if (result.canceled || !result.assets.length) return;
    uploadImgs(result.assets, {
      onSuccess: (res) => setImages((prev) => [...prev, ...res.urls]),
      onError:   (e)   => Alert.alert("Upload Failed", e.message),
    });
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  function toggleCategory(cid: string) {
    setCategoryIds((prev) => prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]);
  }

  function handleSave() {
    const rate = parseFloat(hourlyRate);
    if (!name.trim())        return Alert.alert("Validation", "Ground name is required.");
    if (!address.trim())     return Alert.alert("Validation", "Address is required.");
    if (!city.trim())        return Alert.alert("Validation", "City is required.");
    if (isNaN(rate) || rate < 1) return Alert.alert("Validation", "Enter a valid hourly rate.");
    if (categoryIds.length === 0) return Alert.alert("Validation", "Select at least one sport category.");

    save(
      {
        name:        name.trim(),
        description: description.trim() || undefined,
        address:     address.trim(),
        city:        city.trim(),
        hourlyRate:  rate,
        capacity:    capacity ? parseInt(capacity) : null,
        amenities,
        categoryIds,
        images,
      },
      {
        onSuccess: () => { Alert.alert("Saved", "Ground updated."); router.back(); },
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function Field({
    label, value, onChangeText, placeholder, keyboardType, multiline, icon,
  }: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean; icon?: string;
  }) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={[s.inputWrap, focused && s.inputWrapFocused, multiline && s.inputWrapMultiline]}>
          {icon && (
            <Ionicons
              name={icon as never}
              size={16}
              color={focused ? Colors.primary : Colors.textMuted}
              style={s.inputIcon}
            />
          )}
          <TextInput
            style={[s.input, multiline && s.inputMultiline]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType ?? "default"}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? "top" : "center"}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
      </View>
    );
  }

  const statusMeta = g ? STATUS_META[g.status as FacilityStatus] : null;

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Status banner */}
      {statusMeta && (
        <View style={[s.statusBanner, { backgroundColor: statusMeta.bg, borderColor: statusMeta.color + "44" }]}>
          <Ionicons name={statusMeta.icon as never} size={16} color={statusMeta.color} />
          <Text style={[s.statusBannerText, { color: statusMeta.color }]}>{statusMeta.msg}</Text>
        </View>
      )}

      {/* Basic info section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>FACILITY DETAILS</Text>
        </View>
        <Field
          label="Ground Name *"
          value={name}
          onChangeText={setName}
          placeholder="Green Cricket Ground"
          icon="text-outline"
        />
        <Field
          label="Address *"
          value={address}
          onChangeText={setAddress}
          placeholder="123 Main St, Colombo"
          icon="location-outline"
        />
        <Field
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="Colombo"
          icon="map-outline"
        />
        <View style={s.row}>
          <View style={s.halfLeft}>
            <Field
              label="Hourly Rate (Rs.) *"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="1500"
              keyboardType="numeric"
              icon="cash-outline"
            />
          </View>
          <View style={s.halfRight}>
            <Field
              label="Capacity"
              value={capacity}
              onChangeText={setCapacity}
              placeholder="20"
              keyboardType="numeric"
              icon="people-outline"
            />
          </View>
        </View>
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your facility…"
          multiline
          icon="document-text-outline"
        />
      </View>

      {/* Categories */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="football-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>SPORT CATEGORIES *</Text>
        </View>
        <View style={s.chipWrap}>
          {(catData?.categories ?? []).map((c) => {
            const active = categoryIds.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, active && s.chipActive]}
                onPress={() => toggleCategory(c.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>
                  {c.icon ?? ""} {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Amenities */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>AMENITIES</Text>
        </View>
        <View style={s.chipWrap}>
          {AMENITIES.map((a) => {
            const active = amenities.includes(a);
            return (
              <TouchableOpacity
                key={a}
                style={[s.chip, active && s.chipActive]}
                onPress={() => toggleAmenity(a)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Photos */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="images-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>PHOTOS (max 8)</Text>
        </View>
        <View style={s.imgGrid}>
          {images.map((uri) => (
            <View key={uri} style={s.imgCell}>
              <Image source={{ uri }} style={s.imgThumb} resizeMode="cover" />
              <TouchableOpacity style={s.imgRemove} onPress={() => removeImage(uri)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 8 && (
            <TouchableOpacity style={s.imgAdd} onPress={pickImages} disabled={uploading} activeOpacity={0.7}>
              {uploading
                ? <ActivityIndicator color={Colors.primary} />
                : <>
                    <Ionicons name="add-outline" size={28} color={Colors.primary} />
                    <Text style={s.imgAddText}>Add</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity onPress={handleSave} disabled={isPending || uploading} activeOpacity={0.88}>
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
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
