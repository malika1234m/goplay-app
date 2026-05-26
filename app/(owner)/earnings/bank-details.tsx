import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBankDetails, useSaveBankDetails } from "@/lib/queries/earnings";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function BankDetailsScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { data, isLoading }           = useBankDetails();
  const { mutate: save, isPending }   = useSaveBankDetails();

  const [bankName,          setBankName]          = useState("");
  const [bankBranch,        setBankBranch]        = useState("");
  const [accountNumber,     setAccountNumber]     = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    const b = data?.bankDetails;
    if (!b) return;
    setBankName(b.bankName ?? "");
    setBankBranch(b.bankBranch ?? "");
    setAccountNumber(b.accountNumber ?? "");
    setAccountHolderName(b.accountHolderName ?? "");
  }, [data]);

  if (isLoading) return <LoadingScreen />;

  function handleSave() {
    if (!bankName.trim())          return Alert.alert("Validation", "Bank name is required.");
    if (!accountNumber.trim())     return Alert.alert("Validation", "Account number is required.");
    if (!accountHolderName.trim()) return Alert.alert("Validation", "Account holder name is required.");

    save(
      {
        bankName:          bankName.trim(),
        bankBranch:        bankBranch.trim(),
        accountNumber:     accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      },
      {
        onSuccess: () => { Alert.alert("Saved", "Bank details updated."); router.back(); },
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  const s = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 120 },

    infoCard:    { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.primaryMid },
    infoIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
    infoText:    { fontSize: 13, color: Colors.primaryDark, lineHeight: 20, flex: 1 },

    section:       { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
    sectionLabel:  { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },

    field:          { marginBottom: 14 },
    fieldLabel:     { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    inputWrap:      { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: Colors.card },
    inputIcon:      { marginRight: 8 },
    input:          { flex: 1, fontSize: 15, color: Colors.text },

    saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, height: 52 },
    saveBtnDisabled:{ opacity: 0.6 },
    saveBtnText:    { fontSize: 16, fontWeight: "700", color: Colors.white },
  });

  function Field({
    label, value, onChangeText, placeholder, keyboardType, icon,
  }: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; keyboardType?: "default" | "numeric"; icon?: string;
  }) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
          {icon && (
            <Ionicons
              name={icon as never}
              size={16}
              color={focused ? Colors.primary : Colors.textMuted}
              style={s.inputIcon}
            />
          )}
          <TextInput
            style={s.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType ?? "default"}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info card */}
      <View style={s.infoCard}>
        <View style={s.infoIconBox}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
        </View>
        <Text style={s.infoText}>
          Your bank details are used by the admin to transfer payouts. They are stored securely and never shared publicly.
        </Text>
      </View>

      {/* Form section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="card-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>BANK ACCOUNT DETAILS</Text>
        </View>

        <Field
          label="Bank Name *"
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. Sampath Bank, Commercial Bank"
          icon="business-outline"
        />
        <Field
          label="Branch"
          value={bankBranch}
          onChangeText={setBankBranch}
          placeholder="e.g. Colombo 03"
          icon="location-outline"
        />
        <Field
          label="Account Number *"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="e.g. 1234567890"
          keyboardType="numeric"
          icon="keypad-outline"
        />
        <Field
          label="Account Holder Name *"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          placeholder="Full name as on account"
          icon="person-outline"
        />
      </View>

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
              <Text style={s.saveBtnText}>Save Bank Details</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
