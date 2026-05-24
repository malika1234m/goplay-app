import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReviews, useReportReview, useUnreportReview } from "@/lib/queries/reviews";
import { useColors } from "@/lib/theme";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { Review, ReviewStats } from "@/types";

type StarFilter = 0 | 1 | 2 | 3 | 4 | 5;
type SortKey   = "newest" | "highest" | "lowest";

const SORTS: { key: SortKey; label: string; icon: string }[] = [
  { key: "newest",  label: "Newest",  icon: "time-outline"        },
  { key: "highest", label: "Top",     icon: "arrow-up-outline"    },
  { key: "lowest",  label: "Lowest",  icon: "arrow-down-outline"  },
];

const AVATAR_COLORS = [
  "#16a34a", "#0891b2", "#8b5cf6", "#f59e0b", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function ratingColor(r: number) {
  if (r >= 4) return "#16a34a";
  if (r === 3) return "#d97706";
  return "#dc2626";
}

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const Colors = useColors();
  const [star, setStar] = useState<StarFilter>(0);
  const [sort, setSort] = useState<SortKey>("newest");

  const { data, isLoading, refetch, isRefetching } = useReviews({
    rating: star > 0 ? star : undefined,
    sort,
  });

  const { mutate: report,   isPending: reporting   } = useReportReview();
  const { mutate: unreport, isPending: unreporting } = useUnreportReview();

  const [reportModal,  setReportModal]  = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");

  const stats   = data?.stats;
  const reviews = data?.reviews ?? [];

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },

    header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
    headerSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    flagPill:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fee2e2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fca5a5" },
    flagPillText:{ fontSize: 12, fontWeight: "700", color: "#b91c1c" },

    list:      { padding: 16, paddingBottom: 40 },
    listEmpty: { flex: 1 },

    // Stats card
    statsCard:    { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statsRow:     { flexDirection: "row", gap: 16, marginBottom: 14 },
    statsLeft:    { alignItems: "center", justifyContent: "center", width: 80 },
    bigRating:    { fontSize: 46, fontWeight: "900", color: Colors.text, lineHeight: 50 },
    ratingTotal:  { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: "center" },
    distCol:      { flex: 1, gap: 7, justifyContent: "center" },
    distRow:      { flexDirection: "row", alignItems: "center" },
    distStar:     { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, width: 10 },
    distBarBg:    { flex: 1, height: 7, backgroundColor: Colors.border, borderRadius: 4, overflow: "hidden", marginHorizontal: 4 },
    distBarFill:  { height: "100%", backgroundColor: "#f59e0b", borderRadius: 4 },
    distCount:    { fontSize: 11, color: Colors.textMuted, width: 20, textAlign: "right" },
    statsPillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    statPill:     { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
    statPillVal:  { fontSize: 15, fontWeight: "800" },
    statPillLabel:{ fontSize: 10, fontWeight: "600", marginTop: 1 },

    // Filter card
    filterCard:   { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    filterLabel:  { fontSize: 10, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    sortRow:      { flexDirection: "row", gap: 8 },
    sortChip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    sortChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
    sortChipText:      { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    sortChipTextActive:{ color: Colors.white },
    starRow:      { flexDirection: "row", gap: 6 },
    starChip:     { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    starChipActive:    { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
    starChipText:      { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
    starChipTextActive:{ color: "#92400e" },

    countText: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },

    // Review card
    card:         { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardReported: { borderColor: "#fca5a5", backgroundColor: "#fff8f8" },
    cardTop:      { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    avatar:       { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginRight: 10 },
    avatarText:   { fontSize: 16, fontWeight: "800" },
    cardInfo:     { flex: 1, minWidth: 0 },
    playerName:   { fontSize: 14, fontWeight: "700", color: Colors.text },
    facilityName: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    ratingBadge:  { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    ratingNum:    { fontSize: 15, fontWeight: "800" },
    starsRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    dateText:     { fontSize: 11, color: Colors.textMuted },
    reviewText:   { fontSize: 14, color: Colors.text, lineHeight: 21, marginBottom: 10 },
    noText:       { fontSize: 13, color: Colors.textMuted, fontStyle: "italic", marginBottom: 10 },
    flaggedRow:   { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#fee2e2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8 },
    flaggedText:  { fontSize: 12, color: "#b91c1c", flex: 1, lineHeight: 17 },
    cardAction:   { flexDirection: "row", justifyContent: "flex-end" },
    reportBtn:    { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
    reportText:   { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
    unflagBtn:    { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: Colors.primaryLight, borderRadius: 8 },
    unflagText:   { fontSize: 12, color: Colors.primary, fontWeight: "700" },

    // Report modal
    overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet:          { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitleRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
    sheetIconBox:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
    sheetTitle:     { fontSize: 17, fontWeight: "800", color: Colors.text },
    sheetSub:       { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    fieldLabel:     { fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    input:          { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, minHeight: 88, marginBottom: 4 },
    charCount:      { fontSize: 11, color: Colors.textMuted, textAlign: "right", marginBottom: 16 },
    sheetActions:   { flexDirection: "row", gap: 10 },
    cancelBtn:      { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
    cancelText:     { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
    flagBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 14, backgroundColor: Colors.error },
    flagBtnBusy:    { opacity: 0.6 },
    flagBtnText:    { fontSize: 15, fontWeight: "700", color: Colors.white },
  });

  if (isLoading) return <LoadingScreen />;

  function submitReport() {
    if (!reportModal) return;
    report(
      { id: reportModal.id, reason: reportReason.trim() || undefined },
      {
        onSuccess: () => { setReportModal(null); setReportReason(""); },
        onError:   (e) => Alert.alert("Error", e.message),
      }
    );
  }

  function handleUnreport(review: Review) {
    Alert.alert("Remove Flag", "Remove the flag from this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove Flag", style: "default",
        onPress: () =>
          unreport(review.id, { onError: (e) => Alert.alert("Error", e.message) }),
      },
    ]);
  }

  function StatsSection({ stats }: { stats: ReviewStats }) {
    const sorted = [...stats.distribution].sort((a, b) => b.star - a.star);
    const max    = Math.max(...sorted.map((d) => d.count), 1);

    return (
      <View style={s.statsCard}>
        <View style={s.statsRow}>
          <View style={s.statsLeft}>
            <Text style={s.bigRating}>{stats.avgRating?.toFixed(1) ?? "—"}</Text>
            <Stars rating={stats.avgRating ?? 0} size={16} />
            <Text style={s.ratingTotal}>{stats.total} review{stats.total !== 1 ? "s" : ""}</Text>
          </View>
          <View style={s.distCol}>
            {sorted.map((d) => (
              <View key={d.star} style={s.distRow}>
                <Text style={s.distStar}>{d.star}</Text>
                <Ionicons name="star" size={9} color="#f59e0b" style={{ marginRight: 4 }} />
                <View style={s.distBarBg}>
                  <View style={[s.distBarFill, { width: `${d.count === 0 ? 0 : Math.max(5, Math.round((d.count / max) * 100))}%` as any }]} />
                </View>
                <Text style={s.distCount}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.statsPillRow}>
          <View style={[s.statPill, { backgroundColor: "#0891b2" + "12", borderColor: "#0891b2" + "30" }]}>
            <Ionicons name="calendar-outline" size={14} color="#0891b2" />
            <View>
              <Text style={[s.statPillVal, { color: "#0891b2" }]}>{stats.thisWeek}</Text>
              <Text style={[s.statPillLabel, { color: "#0891b2" + "cc" }]}>This week</Text>
            </View>
          </View>
          {stats.reported > 0 && (
            <View style={[s.statPill, { backgroundColor: Colors.error + "12", borderColor: Colors.error + "30" }]}>
              <Ionicons name="flag-outline" size={14} color={Colors.error} />
              <View>
                <Text style={[s.statPillVal, { color: Colors.error }]}>{stats.reported}</Text>
                <Text style={[s.statPillLabel, { color: Colors.error + "cc" }]}>Flagged</Text>
              </View>
            </View>
          )}
          {stats.total > 0 && (
            <View style={[s.statPill, { backgroundColor: "#f59e0b" + "12", borderColor: "#f59e0b" + "30" }]}>
              <Ionicons name="star-outline" size={14} color="#f59e0b" />
              <View>
                <Text style={[s.statPillVal, { color: "#f59e0b" }]}>{stats.avgRating?.toFixed(1) ?? "—"}</Text>
                <Text style={[s.statPillLabel, { color: "#f59e0b" + "cc" }]}>Avg rating</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  const flaggedCount = stats?.reported ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Reviews</Text>
          {stats && stats.total > 0 && (
            <Text style={s.headerSub}>{stats.total} total · {stats.avgRating?.toFixed(1) ?? "—"} avg</Text>
          )}
        </View>
        {flaggedCount > 0 && (
          <View style={s.flagPill}>
            <Ionicons name="flag" size={12} color="#b91c1c" />
            <Text style={s.flagPillText}>{flaggedCount} flagged</Text>
          </View>
        )}
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[s.list, reviews.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Stats card */}
            {stats && <StatsSection stats={stats} />}

            {/* Filters */}
            <View style={s.filterCard}>
              <Text style={s.filterLabel}>Sort by</Text>
              <View style={s.sortRow}>
                {SORTS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[s.sortChip, sort === item.key && s.sortChipActive]}
                    onPress={() => setSort(item.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as never}
                      size={13}
                      color={sort === item.key ? Colors.white : Colors.textMuted}
                    />
                    <Text style={[s.sortChipText, sort === item.key && s.sortChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.filterLabel, { marginTop: 12 }]}>Filter by stars</Text>
              <View style={s.starRow}>
                <TouchableOpacity
                  style={[s.starChip, star === 0 && s.starChipActive]}
                  onPress={() => setStar(0)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.starChipText, star === 0 && s.starChipTextActive]}>All</Text>
                </TouchableOpacity>
                {([5, 4, 3, 2, 1] as StarFilter[]).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.starChip, star === n && s.starChipActive]}
                    onPress={() => setStar(n)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="star"
                      size={11}
                      color={star === n ? "#92400e" : Colors.textMuted}
                    />
                    <Text style={[s.starChipText, star === n && s.starChipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {reviews.length > 0 && (
              <Text style={s.countText}>
                Showing {data?.filteredTotal ?? reviews.length} review{(data?.filteredTotal ?? 0) !== 1 ? "s" : ""}
                {star > 0 ? ` with ${star} star${star > 1 ? "s" : ""}` : ""}
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => {
          const color = avatarColor(item.userName ?? "?");
          const rc    = ratingColor(item.rating);
          return (
            <View style={[s.card, item.reported && s.cardReported]}>
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: color + "20" }]}>
                  <Text style={[s.avatarText, { color }]}>
                    {item.userName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.playerName}>{item.userName}</Text>
                  <Text style={s.facilityName} numberOfLines={1}>{item.facilityName}</Text>
                </View>
                <View style={[s.ratingBadge, { backgroundColor: rc + "15" }]}>
                  <Text style={[s.ratingNum, { color: rc }]}>{item.rating}</Text>
                  <Ionicons name="star" size={11} color={rc} />
                </View>
              </View>
              <View style={s.starsRow}>
                <Stars rating={item.rating} size={13} />
                <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.reviewText ? (
                <Text style={s.reviewText}>{item.reviewText}</Text>
              ) : (
                <Text style={s.noText}>No written comment</Text>
              )}
              {item.reported && (
                <View style={s.flaggedRow}>
                  <Ionicons name="flag" size={12} color="#b91c1c" />
                  <Text style={s.flaggedText} numberOfLines={2}>
                    Flagged{item.reportReason ? `: ${item.reportReason}` : " for admin review"}
                  </Text>
                </View>
              )}
              <View style={s.cardAction}>
                {item.reported ? (
                  <TouchableOpacity style={s.unflagBtn} onPress={() => handleUnreport(item)} disabled={unreporting} activeOpacity={0.75}>
                    <Ionicons name="flag" size={13} color={Colors.primary} />
                    <Text style={s.unflagText}>{unreporting ? "Removing…" : "Remove Flag"}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.reportBtn} onPress={() => { setReportModal(item); setReportReason(""); }} activeOpacity={0.75}>
                    <Ionicons name="flag-outline" size={13} color={Colors.textMuted} />
                    <Text style={s.reportText}>Flag</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="No reviews"
            sub={star > 0
              ? `No ${star}-star reviews found.`
              : "Reviews from players will appear here after completed sessions."}
          />
        }
      />

      {/* Report Modal */}
      <Modal
        visible={!!reportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModal(null)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetTitleRow}>
              <View style={s.sheetIconBox}>
                <Ionicons name="flag" size={18} color={Colors.error} />
              </View>
              <View>
                <Text style={s.sheetTitle}>Flag Review</Text>
                <Text style={s.sheetSub}>Report to admin for guideline violations</Text>
              </View>
            </View>

            <Text style={s.fieldLabel}>REASON (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="e.g. Offensive language, not a real booking…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
              autoFocus
            />
            <Text style={s.charCount}>{reportReason.length}/300</Text>

            <View style={s.sheetActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setReportModal(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.flagBtn, reporting && s.flagBtnBusy]}
                onPress={submitReport}
                disabled={reporting}
              >
                {reporting
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <>
                      <Ionicons name="flag" size={15} color={Colors.white} />
                      <Text style={s.flagBtnText}>Flag Review</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
