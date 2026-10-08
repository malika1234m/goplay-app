import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/theme";
import { tk } from "@/lib/i18n/core";
import { useT } from "@/lib/i18n/I18nProvider";

export type PayOpt = "ON_ARRIVAL_ONLY" | "ONLINE_ONLY" | "BOTH";

const CHOICES: { value: PayOpt; title: string; body: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "ON_ARRIVAL_ONLY", title: tk("Pay at ground"), body: tk("Cash on arrival"),                  icon: "cash-outline" },
  { value: "ONLINE_ONLY",     title: tk("Online only"),       body: tk("Bank transfer first"), icon: "card-outline" },
  { value: "BOTH",            title: tk("Both"),              body: tk("Player chooses"),                              icon: "swap-horizontal-outline" },
];

/** How a ground takes payment — one choice. */
export default function PaymentOptionsPicker({ value, onChange }: { value: PayOpt | null; onChange: (v: PayOpt) => void }) {
  const { t } = useT();
  const Colors = useColors();
  const s = StyleSheet.create({
    card:   { flexDirection: "row", gap: 12, alignItems: "flex-start", borderRadius: 14, borderWidth: 1.5, padding: 14, backgroundColor: Colors.card },
    title:  { fontSize: 15, fontWeight: "700", color: Colors.text },
    body:   { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  });
  return (
    <View style={{ gap: 10 }} accessibilityRole="radiogroup">
      {CHOICES.map((c) => {
        const on = value === c.value;
        return (
          <TouchableOpacity key={c.value} activeOpacity={0.85} onPress={() => onChange(c.value)}
            accessibilityRole="radio" accessibilityState={{ checked: on }}
            style={[s.card, { borderColor: on ? Colors.primary : Colors.border, backgroundColor: on ? Colors.primaryLight : Colors.card }]}>
            <Ionicons name={c.icon} size={20} color={Colors.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{t(c.title)}</Text>
              <Text style={s.body}>{t(c.body)}</Text>
            </View>
            <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color={on ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
