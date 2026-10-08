import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBankDetails, useSaveBankDetails } from "@/lib/queries/earnings";
import { useOwnerGrounds } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import { useKeyboardPadding } from "@/lib/keyboard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useT } from "@/lib/i18n/I18nProvider";

export default function BankDetailsScreen() {
  const { t } = useT();
  const Colors = useColors();
  const keyboardPad = useKeyboardPadding();
  const router = useRouter();
  const { data, isLoading }           = useBankDetails();
  const { mutate: save, isPending }   = useSaveBankDetails();
  const { data: groundsData }         = useOwnerGrounds();

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
    if (!bankName.trim())                        return Alert.alert(t("Validation"), t("Bank name is required."));
    if (bankName.trim().length > 50)             return Alert.alert(t("Validation"), t("Bank name must be under 50 characters."));
    if (!accountNumber.trim())                   return Alert.alert(t("Validation"), t("Account number is required."));
    const accNum = accountNumber.trim();
    if (accNum.length < 5 || accNum.length > 20) return Alert.alert(t("Validation"), t("Account number must be 5–20 characters."));
    if (!accountHolderName.trim())               return Alert.alert(t("Validation"), t("Account holder name is required."));
    const holder = accountHolderName.trim();
    if (holder.length < 2 || holder.length > 50) return Alert.alert(t("Validation"), t("Account holder name must be 2–50 characters."));
    if (bankBranch.trim().length > 50)           return Alert.alert(t("Validation"), t("Branch name must be under 50 characters."));

    save(
      {
        bankName:          bankName.trim(),
        bankBranch:        bankBranch.trim(),
        accountNumber:     accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      },
      {
        onSuccess: () => { Alert.alert(t("Saved"), t("Payment details updated.")); router.back(); },
        onError:   (e) => Alert.alert(t("Error"), e.message),
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
      contentContainerStyle={[s.scroll, keyboardPad > 0 && { paddingBottom: keyboardPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Each ground's account — owners with several grounds can use a different account per ground */}
      {(groundsData?.grounds?.length ?? 0) > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
            <Text style={s.sectionLabel}>{t("YOUR GROUNDS")}</Text>
          </View>
          {groundsData!.grounds.map((g) => {
            const own = !!(g.paymentBankName && g.paymentAccountName && g.paymentAccountNumber);
            return (
              <TouchableOpacity key={g.id} activeOpacity={0.8}
                onPress={() => router.push(`/(owner)/grounds/${g.id}/payment` as never)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.text }}>{g.name}</Text>
                  <Text style={{ fontSize: 12.5, color: own ? Colors.textMuted : Colors.textSecondary, marginTop: 2 }}>
                    {own ? `${g.paymentAccountName}, ${g.paymentBankName} ••${g.paymentAccountNumber!.replace(/\s+/g, "").slice(-4)}` : t("Uses the default account below")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Info card */}
      <View style={s.infoCard}>
        <View style={s.infoIconBox}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
        </View>
        <Text style={s.infoText}>
          {t("Players who choose \"Pay online\" transfer straight to this account and upload the receipt for you to confirm. It is used for every ground that doesn't have its own payment details, and is only shown to players who are booking.")}
        </Text>
      </View>

      {/* Form section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="card-outline" size={14} color={Colors.textMuted} />
          <Text style={s.sectionLabel}>{t("BANK ACCOUNT DETAILS")}</Text>
        </View>

        <Field
          label={t("Bank Name *")}
          value={bankName}
          onChangeText={setBankName}
          placeholder={t("e.g. Sampath Bank, Commercial Bank")}
          icon="business-outline"
        />
        <Field
          label={t("Branch")}
          value={bankBranch}
          onChangeText={setBankBranch}
          placeholder={t("e.g. Colombo 03")}
          icon="location-outline"
        />
        <Field
          label={t("Account Number *")}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="e.g. 1234567890"
          keyboardType="numeric"
          icon="keypad-outline"
        />
        <Field
          label={t("Account Holder Name *")}
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          placeholder={t("Full name as on account")}
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
              <Text style={s.saveBtnText}>{t("Save Payment Details")}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
