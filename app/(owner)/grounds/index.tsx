import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useOwnerGrounds } from "@/lib/queries/owner";
import { useColors } from "@/lib/theme";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatLKR } from "@/lib/utils";
import type { Ground } from "@/types";

export default function GroundsList() {
  const Colors = useColors();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useOwnerGrounds();
  const grounds = data?.grounds ?? [];

  const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    ACTIVE:   { color: Colors.primary,  bg: Colors.primaryLight },
    PENDING:  { color: "#d97706",       bg: "#fffbeb"           },
    INACTIVE: { color: "#94a3b8",       bg: Colors.background   },
    REJECTED: { color: Colors.error,    bg: Colors.errorLight   },
  };

  const s = StyleSheet.create({
    list:      { padding: 16, paddingBottom: 120 },
    listEmpty: { flex: 1 },

    card:        { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: "hidden" },
    coverImg:    { width: "100%", height: 140 },
    coverPlaceholder: { width: "100%", height: 0 },
    cardBody:    { padding: 16 },
    cardTop:     { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    flex:      { flex: 1 },
    name:      { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    locationRow:{ flexDirection: "row", alignItems: "center", gap: 3 },
    city:      { fontSize: 12, color: Colors.textMuted },

    statusBadge:{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText:{ fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

    tagRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    tag:       { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    tagText:   { fontSize: 11, fontWeight: "600", color: Colors.primaryDark },

    metaRow:   { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    metaItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
    metaValue: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },

    chevronRow:{ position: "absolute", right: 14, top: "50%", marginTop: -9 },

    fab: { position: "absolute", right: 20, bottom: 100, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 28, paddingVertical: 13, paddingHorizontal: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10, overflow: "hidden" },
  });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: Colors.background }}><SkeletonList count={4} /></View>;

  function GroundCard({ ground, onPress }: { ground: Ground; onPress: () => void }) {
    const cfg = STATUS_CONFIG[ground.status] ?? { color: Colors.textMuted, bg: Colors.background };
    return (
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
        {/* Cover image */}
        {ground.images?.[0] ? (
          <Image source={{ uri: ground.images[0] }} style={s.coverImg} resizeMode="cover" />
        ) : null}

        <View style={s.cardBody}>
        {/* Name row + status badge */}
        <View style={s.cardTop}>
          <View style={s.flex}>
            <Text style={s.name} numberOfLines={1}>{ground.name}</Text>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.city}>{ground.city}</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[s.statusText, { color: cfg.color }]}>{ground.status}</Text>
          </View>
        </View>

        {/* Sport tag chips */}
        <View style={s.tagRow}>
          {ground.categories.slice(0, 3).map((c) => (
            <View key={c.name} style={s.tag}>
              <Text style={s.tagText}>{c.icon ? `${c.icon} ` : ""}{c.name}</Text>
            </View>
          ))}
          {ground.categories.length > 3 && (
            <View style={s.tag}>
              <Text style={s.tagText}>+{ground.categories.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Metrics row */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Ionicons name="cash-outline" size={13} color={Colors.textMuted} />
            <Text style={s.metaValue}>{formatLKR(ground.hourlyRate) + "/hr"}</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="grid-outline" size={13} color={Colors.textMuted} />
            <Text style={s.metaValue}>{`${ground.courtCount} court${ground.courtCount !== 1 ? "s" : ""}`}</Text>
          </View>
          {ground.avgRating ? (
            <View style={s.metaItem}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text style={[s.metaValue, { color: "#f59e0b" }]}>{String(ground.avgRating)}</Text>
            </View>
          ) : null}
          <View style={s.metaItem}>
            <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
            <Text style={s.metaValue}>{`${ground.totalReviews} review${ground.totalReviews !== 1 ? "s" : ""}`}</Text>
          </View>
        </View>

        <View style={s.chevronRow}>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
        </View>{/* cardBody */}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={grounds}
        keyExtractor={(g) => g.id}
        contentContainerStyle={[s.list, grounds.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <GroundCard ground={item} onPress={() => router.push(`/(owner)/grounds/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No grounds yet"
            sub="Tap the button below to add your first facility."
          />
        }
      />
      <TouchableOpacity style={s.fab} onPress={() => router.push("/(owner)/grounds/new")} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Add Ground</Text>
      </TouchableOpacity>
    </View>
  );
}
