import { useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useColors } from "@/lib/theme";
import { useOwnerProfile, setupProgress, type SetupGround } from "@/lib/queries/owner";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useT } from "@/lib/i18n/I18nProvider";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface Step {
  key: string;
  title: string;
  body: string;
  done: boolean;
  optional?: boolean;
  /** A single place to fix it… */
  href?: Href;
  /** …or one row per ground */
  grounds?: { ground: SetupGround; ok: boolean; label: string; href: Href }[];
}

/** First-run guide for ground owners — the app version of goplay.lk/ground-owner/setup.
 *  Lives in the Grounds stack so the per-ground steps open on top of it and Back returns here. */
export default function SetupGuide() {
  const { t, tn } = useT();
  const Colors = useColors();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useOwnerProfile();

  // Coming back from a step's screen — pick up what changed
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const s = StyleSheet.create({
    safe:        { flex: 1, backgroundColor: Colors.background },
    scroll:      { padding: 16, paddingBottom: 140, gap: 12 },
    hero:        { backgroundColor: Colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
    heroTitle:   { fontSize: 18, fontWeight: "800", color: Colors.text },
    heroCount:   { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    track:       { height: 8, borderRadius: 4, backgroundColor: Colors.border, marginTop: 12, overflow: "hidden" },
    fill:        { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
    card:        { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
    cardNext:    { borderColor: Colors.primary },
    top:         { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    num:         { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: Colors.border },
    numDone:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
    numText:     { fontSize: 13, fontWeight: "800", color: Colors.textSecondary },
    title:       { fontSize: 15, fontWeight: "700", color: Colors.text },
    optional:    { fontSize: 11, fontWeight: "600", color: Colors.textMuted },
    body:        { fontSize: 13, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
    groundRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginLeft: 40, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.background },
    groundName:  { fontSize: 14, fontWeight: "600", color: Colors.text },
    groundLabel: { fontSize: 12, marginTop: 1 },
  });

  if (isLoading || !data) return <LoadingScreen />;
  const setup    = data.setup;
  const grounds  = data.grounds ?? [];
  const progress = setupProgress(data);
  if (!setup || !progress) return <LoadingScreen />;

  const perGround = (ok: (g: SetupGround) => boolean, label: (g: SetupGround, ok: boolean) => string, href: (g: SetupGround) => Href) =>
    grounds.map((g) => { const done = ok(g); return { ground: g, ok: done, label: label(g, done), href: href(g) }; });

  const statusLabel = (g: SetupGround) =>
    g.status === "ACTIVE" ? t("Live") : g.status === "PENDING" ? t("Being reviewed") : g.status === "REJECTED" ? t("Needs changes — check your email") : t("Hidden");

  const steps: Step[] = [
    { key: "details", title: t("Your contact details"), body: t("We text new bookings to this number."),
      done: setup.contact && setup.business, href: "/(owner)/profile" },
    { key: "method", title: t("How players pay"), body: t("Players only see what you allow."), done: setup.method,
      grounds: perGround((g) => g.paymentOptions !== null,
        (g, ok) => ok ? (g.paymentOptions === "ON_ARRIVAL_ONLY" ? t("Pay at ground") : g.paymentOptions === "ONLINE_ONLY" ? t("Online only") : t("Both")) : t("Not set"),
        (g) => `/(owner)/grounds/${g.id}/payment` as Href) },
    ...(progress.online ? [{ key: "account", title: t("Bank account for online payments"), body: t("Players transfer here and send you the receipt."),
      done: setup.payments, href: "/(owner)/earnings/bank-details" as Href }] : []),
    { key: "photos", title: t("Add photos"), body: t("At least 3 per ground."), done: setup.photos,
      grounds: perGround((g) => g.photos > 0, (g, ok) => ok ? tn(g.photos, "{n} photo", "{n} photos") : t("No photos yet"),
        (g) => `/(owner)/grounds/${g.id}/edit` as Href) },
    { key: "hours", title: t("Opening hours"), body: t("When players can book each ground."), done: setup.hours,
      grounds: perGround((g) => g.openDays > 0, (g, ok) => ok ? tn(g.openDays, "Open {n} day a week", "Open {n} days a week") : t("No open days"),
        (g) => `/(owner)/grounds/${g.id}/availability` as Href) },
    { key: "approval", title: t("GoPlay approval"), body: t("Usually within one working day."), done: setup.approved,
      grounds: perGround((g) => g.status === "ACTIVE", (g) => statusLabel(g), (g) => `/(owner)/grounds/${g.id}` as Href) },
    { key: "team", title: t("Add workers"), body: t("They can confirm bookings and check receipts."), done: setup.workers, optional: true,
      grounds: perGround(() => setup.workers, () => t("Manage facility staff"), (g) => `/(owner)/grounds/${g.id}/workers` as Href) },
  ];
  const nextKey = steps.find((st) => !st.done && !st.optional)?.key;
  const allDone = progress.done === progress.total;
  const firstName = data.user.name.split(" ")[0];

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}>
        <View style={s.hero}>
          <Text style={s.heroTitle}>
            {allDone ? t("You're all set, {name}", { name: firstName }) : t("Welcome, {name}", { name: firstName })}
          </Text>
          <Text style={s.heroCount}>{t("{done}/{total} done", { done: progress.done, total: progress.total })}</Text>
          <View style={s.track}><View style={[s.fill, { width: `${(progress.done / progress.total) * 100}%` }]} /></View>
        </View>

        {grounds.length === 0 && (
          <TouchableOpacity style={[s.card, s.cardNext]} onPress={() => router.push("/(owner)/grounds/new")} activeOpacity={0.8}>
            <View style={s.top}>
              <Ionicons name="add-circle-outline" size={26} color={Colors.primary} />
              <View style={{ flex: 1 }}><Text style={s.title}>{t("Add a ground")}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {steps.map((st, i) => {
          const Card = st.href ? TouchableOpacity : View;
          return (
            <Card key={st.key} style={[s.card, st.key === nextKey && s.cardNext]}
              {...(st.href ? { onPress: () => router.push(st.href!), activeOpacity: 0.8 } : {})}>
              <View style={s.top}>
                <View style={[s.num, st.done && s.numDone]}>
                  {st.done ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={s.numText}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{st.title}{st.optional ? <Text style={s.optional}>{"  "}{t("Optional")}</Text> : null}</Text>
                  <Text style={s.body}>{st.body}</Text>
                </View>
                {st.href && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
              </View>
              {st.grounds?.map(({ ground, ok, label, href }) => (
                <TouchableOpacity key={ground.id} style={s.groundRow} onPress={() => router.push(href)} activeOpacity={0.75}>
                  <Ionicons name={(ok ? "checkmark-circle" : "ellipse-outline") as IoniconsName} size={18} color={ok ? Colors.primary : Colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.groundName} numberOfLines={1}>{ground.name}</Text>
                    <Text style={[s.groundLabel, { color: ok ? Colors.textMuted : Colors.warning }]}>{label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
