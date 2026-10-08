import { useState } from "react";
import PaymentOptionsPicker, { type PayOpt } from "@/components/payments/PaymentOptionsPicker";
import { useKeyboardPadding } from "@/lib/keyboard";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCategories, useUploadGroundImages } from "@/lib/queries/groundManagement";
import { useCreateGround } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import { useT } from "@/lib/i18n/I18nProvider";
import { tk } from "@/lib/i18n/core";

const AMENITIES = [
  tk("Parking"), tk("Changing Rooms"), tk("Showers"), tk("Toilets"), tk("Floodlights"),
  tk("Equipment Rental"), tk("Cafeteria"), tk("WiFi"), tk("First Aid Kit"), tk("Covered Area"),
  tk("Lockers"), tk("Water Supply"), tk("Security Guard"), tk("CCTV"),
];

export default function NewGround() {
  const { t } = useT();
  const keyboardPad = useKeyboardPadding();
  const Colors = useColors();
  const router  = useRouter();

  const { data: catData } = useCategories();
  const categories = catData?.categories ?? [];

  const { mutate: create,  isPending: saving }    = useCreateGround();
  const { mutate: uploadImgs, isPending: uploading } = useUploadGroundImages();

  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("");
  const [hourlyRate,  setHourlyRate]  = useState("");
  const [capacity,    setCapacity]    = useState("");
  const [amenities,   setAmenities]   = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [images,      setImages]      = useState<string[]>([]);
  const [payOpt,      setPayOpt]      = useState<PayOpt | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function pickImages() {
    // Uses the Android system photo picker on Android 13+ — no storage
    // permission required (complies with Google Play Photo & Video Permissions policy).
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 8 - images.length,
      quality: 0.85,
    });
    if (result.canceled || !result.assets.length) return;
    uploadImgs(result.assets, {
      onSuccess: (res) => setImages((prev) => [...prev, ...res.urls]),
      onError:   (e)   => Alert.alert(t("Upload Failed"), e.message),
    });
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  function handleSubmit() {
    const trimName    = name.trim();
    const trimAddress = address.trim();
    const trimCity    = city.trim();
    const rate        = Number(hourlyRate);
    const cap         = capacity.trim() ? Number(capacity.trim()) : undefined;

    if (trimName.length < 3)          return Alert.alert(t("Validation"), t("Ground name must be at least 3 characters."));
    if (trimName.length > 100)        return Alert.alert(t("Validation"), t("Ground name must be under 100 characters."));
    if (trimAddress.length < 5)       return Alert.alert(t("Validation"), t("Address must be at least 5 characters."));
    if (trimCity.length < 2)          return Alert.alert(t("Validation"), t("City must be at least 2 characters."));
    if (!rate || rate < 1)            return Alert.alert(t("Validation"), t("Enter a valid hourly rate (at least Rs. 1)."));
    if (rate > 100000)                return Alert.alert(t("Validation"), t("Hourly rate cannot exceed Rs. 100,000."));
    if (categoryIds.length === 0)     return Alert.alert(t("Validation"), t("Select at least one sport category."));
    if (!payOpt)                      return Alert.alert(t("Validation"), t("Choose how players pay for this ground."));
    if (cap !== undefined && cap < 1)   return Alert.alert(t("Validation"), t("Capacity must be at least 1."));
    if (cap !== undefined && cap > 500) return Alert.alert(t("Validation"), t("Capacity cannot exceed 500 players."));

    create(
      {
        name: trimName, description: description.trim() || undefined,
        address: trimAddress, city: trimCity,
        hourlyRate: rate, capacity: cap,
        amenities, categoryIds, images, paymentOptions: payOpt,
      },
      {
        onSuccess: () => {
          Alert.alert(
            t("Submitted!"),
            t("Your ground has been submitted for admin review. You'll be notified once it's approved."),
            [{ text: t("OK"), onPress: () => router.back() }]
          );
        },
        onError: (e) => Alert.alert(t("Error"), e.message),
      }
    );
  }

  const s = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },

    header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: Colors.text, textAlign: "center", marginRight: 40 },

    scroll: { paddingHorizontal: 16, paddingBottom: 40 },

    section:      { marginTop: 20 },
    sectionLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },

    field:        { marginBottom: 14 },
    fieldLabel:   { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputIcon:    { marginRight: 8 },
    input:        { flex: 1, fontSize: 15, color: Colors.text },
    inputMulti:   { height: 88, alignItems: "flex-start", paddingTop: 12 },
    inputMultiText:{ textAlignVertical: "top" },
    row2:         { flexDirection: "row", gap: 10 },
    half:         { flex: 1 },

    chips:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    chipActive:{ backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
    chipText:  { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    chipTextActive: { color: Colors.primary },

    imgGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    imgCell:   { width: 88, height: 88, borderRadius: 10, overflow: "visible" },
    imgThumb:  { width: 88, height: 88, borderRadius: 10 },
    imgRemove: { position: "absolute", top: -8, right: -8, zIndex: 1 },
    imgAdd:    { width: 88, height: 88, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
    imgAddText:{ fontSize: 11, fontWeight: "600", color: Colors.primary },

    submitSection: { marginTop: 28, marginBottom: 8 },
    infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.primary + "44" },
    infoText:{ fontSize: 13, color: Colors.primary, flex: 1, lineHeight: 19 },
    submitBtn: { borderRadius: 16, overflow: "hidden" },
    submitGrad:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
    submitBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
  });

  return (
    <KeyboardAvoidingView style={s.flex} enabled={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("Add New Ground")}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.scroll, keyboardPad > 0 && { paddingBottom: keyboardPad }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Basic info */}
        <View style={s.section}>
          <View style={s.sectionLabel}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>{t("Basic Info")}</Text>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t("Ground Name *")}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="business-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t("e.g. Colombo Sports Arena")} placeholderTextColor={Colors.textMuted} returnKeyType="next" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t("Description")}</Text>
            <View style={[s.inputWrap, s.inputMulti]}>
              <TextInput style={[s.input, s.inputMultiText]} value={description} onChangeText={setDescription} placeholder={t("Describe your facility…")} placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t("Address *")}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="location-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder={t("Street address")} placeholderTextColor={Colors.textMuted} returnKeyType="next" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t("City *")}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="map-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} value={city} onChangeText={setCity} placeholder={t("e.g. Colombo")} placeholderTextColor={Colors.textMuted} returnKeyType="next" />
            </View>
          </View>

          <View style={s.row2}>
            <View style={[s.field, s.half]}>
              <Text style={s.fieldLabel}>{t("Hourly Rate (Rs.) *")}</Text>
              <View style={s.inputWrap}>
                <Ionicons name="cash-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput style={s.input} value={hourlyRate} onChangeText={setHourlyRate} placeholder="1500" placeholderTextColor={Colors.textMuted} keyboardType="numeric" returnKeyType="next" />
              </View>
            </View>
            <View style={[s.field, s.half]}>
              <Text style={s.fieldLabel}>{t("Capacity")}</Text>
              <View style={s.inputWrap}>
                <Ionicons name="people-outline" size={16} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput style={s.input} value={capacity} onChangeText={setCapacity} placeholder="22" placeholderTextColor={Colors.textMuted} keyboardType="numeric" returnKeyType="done" />
              </View>
            </View>
          </View>
          <View style={[s.field, { marginTop: 6 }]}>
            <Text style={s.fieldLabel}>How do players pay? *</Text>
            <PaymentOptionsPicker value={payOpt} onChange={setPayOpt} />
          </View>
        </View>

        {/* Sport Categories */}
        <View style={s.section}>
          <View style={s.sectionLabel}>
            <Ionicons name="football-outline" size={15} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>{t("Sport Categories *")}</Text>
          </View>
          <View style={s.chips}>
            {categories.map((c) => (
              <TouchableOpacity key={c.id} style={[s.chip, categoryIds.includes(c.id) && s.chipActive]} onPress={() => toggleCategory(c.id)} activeOpacity={0.7}>
                <Text style={[s.chipText, categoryIds.includes(c.id) && s.chipTextActive]}>
                  {c.icon ? `${c.icon} ` : ""}{c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={s.section}>
          <View style={s.sectionLabel}>
            <Ionicons name="sparkles-outline" size={15} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>{t("Amenities")}</Text>
          </View>
          <View style={s.chips}>
            {AMENITIES.map((a) => (
              <TouchableOpacity key={a} style={[s.chip, amenities.includes(a) && s.chipActive]} onPress={() => toggleAmenity(a)} activeOpacity={0.7}>
                <Text style={[s.chipText, amenities.includes(a) && s.chipTextActive]}>{t(a)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={s.section}>
          <View style={s.sectionLabel}>
            <Ionicons name="images-outline" size={15} color={Colors.textMuted} />
            <Text style={s.sectionTitle}>{t("Photos (optional, max 8)")}</Text>
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
                      <Text style={s.imgAddText}>{t("Add")}</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <View style={s.submitSection}>
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={s.infoText}>{t("Your ground will be reviewed by the GoPlay team before going live. This usually takes 1–3 business days.")}</Text>
          </View>
          <TouchableOpacity style={[s.submitBtn, (saving || uploading) && { opacity: 0.65 }]} onPress={handleSubmit} disabled={saving || uploading} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color={Colors.white} />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                    <Text style={s.submitBtnText}>{t("Submit for Review")}</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
