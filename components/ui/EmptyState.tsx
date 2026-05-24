import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Props {
  icon?:        IoniconsName;
  title:        string;
  sub?:         string;
  ctaLabel?:    string;
  onCta?:       () => void;
}

export default function EmptyState({ icon = "mail-outline", title, sub, ctaLabel, onCta }: Props) {
  const Colors = useColors();

  const s = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 },
    iconWrap:  { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    title:     { fontSize: 16, fontWeight: "700", color: Colors.text, textAlign: "center" },
    sub:       { fontSize: 13, color: Colors.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 },
    cta:       { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 11 },
    ctaText:   { fontSize: 14, fontWeight: "700", color: Colors.white },
  });

  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={32} color={Colors.primary} />
      </View>
      <Text style={s.title}>{title}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
      {ctaLabel && onCta && (
        <TouchableOpacity style={s.cta} onPress={onCta} activeOpacity={0.85}>
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
