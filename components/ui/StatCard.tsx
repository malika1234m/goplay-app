import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Props {
  label:   string;
  value:   string;
  sub?:    string;
  accent?: string;
  icon?:   IoniconsName;
}

export default function StatCard({ label, value, sub, accent, icon }: Props) {
  const Colors = useColors();
  const accentColor = accent ?? Colors.primary;

  const s = StyleSheet.create({
    card:    { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginHorizontal: 4, borderTopWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    value:   { fontSize: 22, fontWeight: "900", marginBottom: 2, letterSpacing: -0.3 },
    label:   { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
    sub:     { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  });

  return (
    <View style={[s.card, { borderTopColor: accentColor }]}>
      {icon && (
        <View style={[s.iconBox, { backgroundColor: accentColor + "18" }]}>
          <Ionicons name={icon} size={16} color={accentColor} />
        </View>
      )}
      <Text style={[s.value, { color: accentColor }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
    </View>
  );
}
