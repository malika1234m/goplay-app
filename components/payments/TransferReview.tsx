import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/lib/theme";
import { formatLKR } from "@/lib/utils";
import { useReviewPayment } from "@/lib/queries/payments";
import ReceiptViewer, { isPdfReceipt, openReceipt } from "./ReceiptViewer";
import type { PaymentStatus } from "@/types";

interface Props {
  kind:          "booking" | "spot";
  id:            string;
  playerName:    string;
  amount:        number;
  paymentStatus: PaymentStatus;
  receiptUrl:    string | null | undefined;
  rejectReason:  string | null | undefined;
  onReviewed?:   (action: "confirm" | "reject") => void;
}

/** Bank transfer receipt with confirm / reject actions for owners and workers. */
export default function TransferReview({ kind, id, playerName, amount, paymentStatus, receiptUrl, rejectReason, onReviewed }: Props) {
  const Colors = useColors();
  const [viewing,   setViewing]   = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason,    setReason]    = useState("");
  const { mutate: review, isPending } = useReviewPayment();

  const s = StyleSheet.create({
    wrap:      { gap: 12 },
    thumbRow:  { flexDirection: "row", gap: 12, alignItems: "center" },
    thumb:     { width: 84, height: 84, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    thumbImg:  { width: "100%", height: "100%" },
    pdfText:   { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
    meta:      { flex: 1, gap: 4 },
    metaTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
    metaSub:   { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
    note:      { borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 17 },
    btnRow:    { flexDirection: "row", gap: 10 },
    btn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 13 },
    btnText:   { fontSize: 14, fontWeight: "700" },
    overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet:     { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 12 },
    sheetTitle:{ fontSize: 18, fontWeight: "800", color: Colors.text },
    sheetSub:  { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
    input:     { minHeight: 90, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, backgroundColor: Colors.background, textAlignVertical: "top" },
  });

  function submit(action: "confirm" | "reject") {
    review({ item: { kind, id }, action, reason: action === "reject" ? reason.trim() : undefined }, {
      onSuccess: () => {
        Haptics.notificationAsync(action === "confirm" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
        setRejecting(false);
        setReason("");
        onReviewed?.(action);
      },
      onError: (e) => Alert.alert("Error", e.message),
    });
  }

  function confirm() {
    Alert.alert(
      "Confirm booking",
      `Has ${formatLKR(amount)} from ${playerName} reached your bank account? Confirming books the slot and tells the player.`,
      [
        { text: "Not yet", style: "cancel" },
        { text: "Yes, confirm booking", onPress: () => submit("confirm") },
      ],
    );
  }

  if (!receiptUrl) {
    return (
      <Text style={[s.note, { backgroundColor: Colors.warningLight, color: Colors.warning }]}>
        Waiting for {playerName} to transfer {formatLKR(amount)} and upload the receipt.
        The slot is released automatically if no receipt arrives in time.
      </Text>
    );
  }

  const pdf = isPdfReceipt(receiptUrl);

  return (
    <View style={s.wrap}>
      <View style={s.thumbRow}>
        <TouchableOpacity style={s.thumb} onPress={() => openReceipt(receiptUrl, setViewing)} activeOpacity={0.8} accessibilityLabel="View receipt">
          {pdf ? (
            <><Ionicons name="document-text-outline" size={28} color={Colors.textMuted} /><Text style={s.pdfText}>PDF</Text></>
          ) : (
            <Image source={{ uri: receiptUrl }} style={s.thumbImg} resizeMode="cover" />
          )}
        </TouchableOpacity>
        <View style={s.meta}>
          <Text style={s.metaTitle}>
            {paymentStatus === "RECEIPT_SUBMITTED" ? "Receipt to review" : paymentStatus === "PAID" ? "Payment confirmed" : paymentStatus === "REJECTED" ? "Receipt rejected" : "Receipt"}
          </Text>
          <Text style={s.metaSub}>Tap the receipt to zoom. Check your bank app for {formatLKR(amount)} before confirming.</Text>
        </View>
      </View>

      {paymentStatus === "REJECTED" && (
        <Text style={[s.note, { backgroundColor: Colors.errorLight, color: Colors.error }]}>
          {rejectReason ? `You rejected this: ${rejectReason}` : "Rejected without a reason — the player may raise a complaint with GoPlay."}
        </Text>
      )}

      {paymentStatus === "RECEIPT_SUBMITTED" && (
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, { borderWidth: 1.5, borderColor: Colors.error }]} onPress={() => setRejecting(true)} disabled={isPending} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={[s.btnText, { color: Colors.error }]}>Not received</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: Colors.primary }]} onPress={confirm} disabled={isPending} activeOpacity={0.8}>
            {isPending ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={[s.btnText, { color: "#fff" }]}>Confirm booking</Text></>}
          </TouchableOpacity>
        </View>
      )}

      <ReceiptViewer url={viewing} onClose={() => setViewing(null)} />

      <Modal visible={rejecting} animationType="slide" transparent onRequestClose={() => setRejecting(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.overlay}>
            <View style={s.sheet}>
              <Text style={s.sheetTitle}>Money not in your account?</Text>
              <Text style={s.sheetSub}>
                {playerName} will be asked to upload a new receipt. Tell them why — players can raise a complaint with GoPlay if you don&apos;t give a reason.
              </Text>
              <TextInput
                style={s.input}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. No transfer received / amount is short / receipt unreadable"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={500}
              />
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.btn, { backgroundColor: Colors.background }]} onPress={() => setRejecting(false)} activeOpacity={0.8}>
                  <Text style={[s.btnText, { color: Colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: Colors.error }]} onPress={() => submit("reject")} disabled={isPending} activeOpacity={0.8}>
                  {isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[s.btnText, { color: "#fff" }]}>Send back to player</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
