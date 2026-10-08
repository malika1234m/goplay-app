import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useColors } from "@/lib/theme";
import { useInbox } from "@/lib/queries/payments";
import { useT } from "@/lib/i18n/I18nProvider";

/** Nudge into the Needs action inbox (receipts, cash requests, refunds). */
export default function ReceiptsBanner({ href }: { href: Href }) {
  const { t, tn } = useT();
  const Colors = useColors();
  const router = useRouter();
  const { data } = useInbox();
  const receipts = data?.toReview.length ?? 0;
  const count    = receipts + (data?.cashToConfirm.length ?? 0) + (data?.refunds.length ?? 0);
  if (count === 0) return null;

  const s = StyleSheet.create({
    banner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.warningLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.warning },
    icon:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
    title:  { fontSize: 14, fontWeight: "700", color: Colors.text },
    sub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  });

  return (
    <TouchableOpacity style={s.banner} onPress={() => router.push(href)} activeOpacity={0.85}>
      <View style={s.icon}><Ionicons name="receipt-outline" size={18} color={Colors.warning} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{tn(count, "{n} thing needs you", "{n} things need you")}</Text>
        <Text style={s.sub}>{receipts > 0 ? `${tn(receipts, "{n} receipt to check", "{n} receipts to check")} · ` : ""}{t("Open Needs action")}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.warning} />
    </TouchableOpacity>
  );
}
