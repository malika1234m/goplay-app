import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LANGS } from "@/lib/i18n/core";
import { useT } from "@/lib/i18n/I18nProvider";
import { useColors } from "@/lib/theme";

/** English | සිංහල segmented control. Saved on the device and applied at once. */
export default function LanguageSwitch({ onDark = false }: { onDark?: boolean }) {
  const Colors = useColors();
  const { lang, setLang, t } = useT();

  const s = StyleSheet.create({
    wrap: { flexDirection: "row", borderRadius: 10, padding: 3, gap: 3,
            backgroundColor: onDark ? "rgba(255,255,255,0.12)" : Colors.background,
            borderWidth: 1, borderColor: onDark ? "rgba(255,255,255,0.2)" : Colors.border },
    opt:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    on:   { backgroundColor: onDark ? "#ffffff" : Colors.primary },
    txt:  { fontSize: 13, fontWeight: "700", color: onDark ? "rgba(255,255,255,0.8)" : Colors.textSecondary },
    txtOn:{ color: onDark ? Colors.primaryDeep : "#ffffff" },
  });

  return (
    <View style={s.wrap} accessibilityRole="radiogroup" accessibilityLabel={t("Language")}>
      {LANGS.map((l) => {
        const on = lang === l.code;
        return (
          <TouchableOpacity key={l.code} onPress={() => !on && setLang(l.code)} style={[s.opt, on && s.on]}
            accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={l.label}>
            <Text style={[s.txt, on && s.txtOn]}>{l.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
