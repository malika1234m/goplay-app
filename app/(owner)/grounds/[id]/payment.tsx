import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/lib/theme";
import { useKeyboardPadding } from "@/lib/keyboard";
import { useGroundPaymentDetails, useSaveGroundPaymentDetails } from "@/lib/queries/payments";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PaymentOptionsPicker, { type PayOpt } from "@/components/payments/PaymentOptionsPicker";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n/I18nProvider";

/** Bank account players transfer to for this ground. Blank = use the owner's default details. */
export default function GroundPaymentDetailsScreen() {
  const { t } = useT();
  const Colors      = useColors();
  const keyboardPad = useKeyboardPadding();
  const router      = useRouter();
  const { id }      = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGroundPaymentDetails(id);
  const { mutate: save, isPending } = useSaveGroundPaymentDetails(id);

  const [bankName,      setBankName]      = useState("");
  const [bankBranch,    setBankBranch]    = useState("");
  const [accountName,   setAccountName]   = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions,  setInstructions]  = useState("");
  const [payOpt,        setPayOpt]        = useState<PayOpt | null>(null);

  useEffect(() => {
    api.get<{ ground: { paymentOptions: PayOpt | null } }>(`/api/ground-owner/grounds/${id}`)
      .then((d) => setPayOpt(d.ground.paymentOptions))
      .catch(() => {});
  }, [id]);

  function choosePayOpt(v: PayOpt) {
    const before = payOpt;
    setPayOpt(v);
    api.put(`/api/ground-owner/grounds/${id}`, { paymentOptions: v })
      .catch((e: Error) => { setPayOpt(before); Alert.alert(t("Error"), e.message); });
  }

  useEffect(() => {
    const p = data?.paymentDetails;
    if (!p) return;
    setBankName(p.paymentBankName ?? "");
    setBankBranch(p.paymentBankBranch ?? "");
    setAccountName(p.paymentAccountName ?? "");
    setAccountNumber(p.paymentAccountNumber ?? "");
    setInstructions(p.paymentInstructions ?? "");
  }, [data]);

  const s = StyleSheet.create({
    scroll:   { padding: 16, paddingBottom: 120 },
    info:     { flexDirection: "row", gap: 10, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.primaryMid },
    infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.primaryDark },
    section:  { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    label:    { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    input:    { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48, fontSize: 15, color: Colors.text, marginBottom: 14 },
    multi:    { height: 90, paddingTop: 12, textAlignVertical: "top" },
    saveBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, height: 52, backgroundColor: Colors.primary },
    saveText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  });

  if (isLoading) return <LoadingScreen />;

  function handleSave() {
    const anyAccount = bankName.trim() || bankBranch.trim() || accountName.trim() || accountNumber.trim();
    if (anyAccount) {
      if (!bankName.trim()) return Alert.alert(t("Validation"), t("Bank name is required."));
      if (accountName.trim().length < 2) return Alert.alert(t("Validation"), t("Account holder name is required."));
      if (!/^[0-9\- ]{5,24}$/.test(accountNumber.trim())) return Alert.alert(t("Validation"), t("Account number must be 5–24 digits."));
    }
    save(
      {
        paymentBankName:      bankName.trim()      || null,
        paymentBankBranch:    bankBranch.trim()    || null,
        paymentAccountName:   accountName.trim()   || null,
        paymentAccountNumber: accountNumber.trim() || null,
        paymentInstructions:  instructions.trim()  || null,
      },
      {
        onSuccess: () => { Alert.alert(t("Saved"), t("Payment details updated.")); router.back(); },
        onError:   (e) => Alert.alert(t("Error"), e.message),
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={[s.scroll, keyboardPad > 0 && { paddingBottom: keyboardPad }]} keyboardShouldPersistTaps="handled">
      <Text style={[s.label, { marginBottom: 8 }]}>{t("How players pay")}</Text>
      <View style={{ marginBottom: 20 }}>
        <PaymentOptionsPicker value={payOpt} onChange={choosePayOpt} />
      </View>

      <View style={s.info}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        <Text style={s.infoText}>
          {t("Players booking this ground with \"Pay online\" transfer to this account and upload the receipt. Leave the account fields blank to use your default payment details.")}
        </Text>
      </View>
      <View style={s.section}>
        <Text style={s.label}>{t("Bank name")}</Text>
        <TextInput style={s.input} value={bankName} onChangeText={setBankName} placeholder={t("e.g. Commercial Bank")} placeholderTextColor={Colors.textMuted} maxLength={50} />
        <Text style={s.label}>{t("Branch")}</Text>
        <TextInput style={s.input} value={bankBranch} onChangeText={setBankBranch} placeholder={t("e.g. Kandy")} placeholderTextColor={Colors.textMuted} maxLength={60} />
        <Text style={s.label}>{t("Account holder name")}</Text>
        <TextInput style={s.input} value={accountName} onChangeText={setAccountName} placeholderTextColor={Colors.textMuted} maxLength={60} />
        <Text style={s.label}>{t("Account number")}</Text>
        <TextInput style={s.input} value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" placeholderTextColor={Colors.textMuted} maxLength={24} />
        <Text style={s.label}>{t("Instructions for players (optional)")}</Text>
        <TextInput style={[s.input, s.multi]} value={instructions} onChangeText={setInstructions} multiline maxLength={500}
          placeholder={t("e.g. Use your booking reference as the transfer remark.")} placeholderTextColor={Colors.textMuted} />
      </View>
      <TouchableOpacity style={[s.saveBtn, isPending && { opacity: 0.6 }]} onPress={handleSave} disabled={isPending} activeOpacity={0.88}>
        {isPending ? <ActivityIndicator color={Colors.white} /> : <><Ionicons name="checkmark-outline" size={20} color={Colors.white} /><Text style={s.saveText}>{t("Save Payment Details")}</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}
