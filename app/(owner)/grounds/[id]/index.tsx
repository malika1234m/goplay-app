import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, RefreshControl, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useGround } from "@/lib/queries/groundManagement";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { formatLKR } from "@/lib/utils";

const IMG_W = Dimensions.get("window").width - 32;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function GroundHub() {
  const Colors = useColors();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const router     = useRouter();
  const navigation = useNavigation();

  const { data, isLoading, refetch, isRefetching } = useGround(id);
  const g = data?.ground;

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE:   Colors.primary,
    PENDING:  "#d97706",
    INACTIVE: "#94a3b8",
    REJECTED: Colors.error,
  };

  const ACTIONS: { route: string; icon: IoniconsName; title: string; sub: string }[] = [
    { route: "edit",         icon: "create-outline",            title: "Edit Details",  sub: "Name, rate, amenities"  },
    { route: "courts",       icon: "tennisball-outline",        title: "Courts",        sub: "Add & manage courts"    },
    { route: "availability", icon: "time-outline",              title: "Availability",  sub: "Opening hours"          },
    { route: "blocked",      icon: "ban-outline",               title: "Blocked Dates", sub: "Close for maintenance"  },
    { route: "workers",      icon: "people-outline",            title: "Workers",       sub: "Manage facility staff"  },
  ];

  const s = StyleSheet.create({
    scroll:       { padding: 16, paddingBottom: 120 },

    headerCard:   { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    statusRow:    { flexDirection: "row", marginBottom: 8 },
    statusBadge:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dot:          { width: 6, height: 6, borderRadius: 3 },
    statusText:   { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
    address:      { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
    desc:         { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },
    tagRow:       { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tag:          { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    tagText:      { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },

    statsRow:     { flexDirection: "row", gap: 10, marginBottom: 12 },
    statBox:      { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
    statValue:    { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 2 },
    statLabel:    { fontSize: 11, color: Colors.textMuted },

    amenitiesCard:{ backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },

    sectionLabel: { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

    actionGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    actionCard:    { width: "47.5%", backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
    actionIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    actionTitle:   { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 2 },
    actionSub:     { fontSize: 11, color: Colors.textMuted },

    amenityTag:   { backgroundColor: Colors.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
    amenityText:  { fontSize: 12, color: Colors.textSecondary },

    galleryCard:  { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    galleryScroll:{ marginHorizontal: -4 },
    galleryImg:   { width: 180, height: 120, borderRadius: 10, marginHorizontal: 4 },
  });

  useLayoutEffect(() => {
    if (g) navigation.setOptions({ title: g.name });
  }, [g]);

  if (isLoading) return <LoadingScreen />;
  if (!g) return null;

  const statusColor = STATUS_COLOR[g.status] ?? Colors.textMuted;

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      {/* Status + categories */}
      <View style={s.headerCard}>
        <View style={s.statusRow}>
          <View style={[s.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <View style={[s.dot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusText, { color: statusColor }]}>{g.status}</Text>
          </View>
        </View>
        <Text style={s.address}>{g.address}, {g.city}</Text>
        {g.description ? <Text style={s.desc} numberOfLines={3}>{g.description}</Text> : null}
        <View style={s.tagRow}>
          {g.categories.map((c) => (
            <View key={c.id} style={s.tag}>
              <Text style={s.tagText}>{c.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Images gallery */}
      {g.images.length > 0 && (
        <View style={s.galleryCard}>
          <Text style={s.sectionLabel}>PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.galleryScroll}>
            {g.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.galleryImg} resizeMode="cover" />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{formatLKR(g.hourlyRate)}</Text>
          <Text style={s.statLabel}>Hourly Rate</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{g.capacity ? `${g.capacity} players` : "—"}</Text>
          <Text style={s.statLabel}>Capacity</Text>
        </View>
      </View>

      {/* Amenities */}
      {g.amenities.length > 0 && (
        <View style={s.amenitiesCard}>
          <Text style={s.sectionLabel}>AMENITIES</Text>
          <View style={s.tagRow}>
            {g.amenities.map((a) => (
              <View key={a} style={s.amenityTag}>
                <Text style={s.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Management actions */}
      <Text style={s.sectionLabel}>MANAGE</Text>
      <View style={s.actionGrid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.route}
            style={s.actionCard}
            onPress={() => router.push(`/(owner)/grounds/${id}/${action.route}`)}
            activeOpacity={0.75}
          >
            <View style={s.actionIconBox}>
              <Ionicons name={action.icon} size={24} color={Colors.primary} />
            </View>
            <Text style={s.actionTitle}>{action.title}</Text>
            <Text style={s.actionSub}>{action.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
