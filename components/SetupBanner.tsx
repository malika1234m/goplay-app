import { useCallback } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useColors } from "@/lib/theme";
import { useOwnerProfile, setupProgress } from "@/lib/queries/owner";
import { useT } from "@/lib/i18n/I18nProvider";

/** Home nudge into the setup guide until every required step is done (mirrors the web dashboard banner). */
export default function SetupBanner() {
  const { t } = useT();
  const Colors = useColors();
  const router = useRouter();
  const { data, refetch } = useOwnerProfile();
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const progress = setupProgress(data);
  if (!progress || progress.done === progress.total) return null;

  const s = StyleSheet.create({
    banner: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.primaryMid },
    count:  { fontSize: 26, fontWeight: "800", color: Colors.primaryDark },
    total:  { color: Colors.textMuted },
    title:  { fontSize: 15, fontWeight: "700", color: Colors.text },
    sub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  });

  return (
    <TouchableOpacity style={s.banner} onPress={() => router.push("/(owner)/grounds/setup")} activeOpacity={0.85}>
      <Text style={s.count}>{progress.done}<Text style={s.total}>/{progress.total}</Text></Text>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{t("Finish setup")}</Text>
        <Text style={s.sub}>{t("Setup guide")}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
    </TouchableOpacity>
  );
}
