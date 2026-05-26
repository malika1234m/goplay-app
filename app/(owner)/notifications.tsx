import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/theme";
import {
  useNotifications, useMarkNotificationRead, useMarkAllRead, useClearReadNotifications,
} from "@/lib/queries/notifications";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsScreen() {
  const Colors = useColors();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const { mutate: markRead }  = useMarkNotificationRead();
  const { mutate: markAll }   = useMarkAllRead();
  const { mutate: clearRead } = useClearReadNotifications();

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount ?? 0;

  const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
    info:    { icon: "information-circle", color: Colors.info,    bg: "#e0f2fe"         },
    success: { icon: "checkmark-circle",   color: Colors.primary, bg: Colors.primaryLight },
    warning: { icon: "warning",            color: "#d97706",      bg: "#fffbeb"         },
    error:   { icon: "alert-circle",       color: Colors.error,   bg: Colors.errorLight },
  };

  const s = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: Colors.background },
    header:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title:   { fontSize: 22, fontWeight: "800", color: Colors.text },
    sub:     { fontSize: 13, color: Colors.primary, fontWeight: "600", marginTop: 2 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    actionBtn:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    actionText:    { fontSize: 12, fontWeight: "600", color: Colors.primary },
    list:    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
    listEmpty:{ flex: 1 },
    item:        { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    itemUnread:  { borderColor: Colors.primaryMid, backgroundColor: Colors.primaryLight + "80" },
    iconBox:     { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 },
    itemBody:    { flex: 1 },
    itemTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 },
    itemTitle:   { fontSize: 14, fontWeight: "600", color: Colors.text, flex: 1, marginRight: 8 },
    itemTitleUnread: { fontWeight: "700" },
    itemTime:    { fontSize: 11, color: Colors.textMuted },
    itemMsg:     { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
    dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8, marginTop: 4, flexShrink: 0 },
  });

  function handleClear() {
    Alert.alert("Clear Read", "Remove all read notifications?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearRead() },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 && <Text style={s.sub}>{unreadCount} unread</Text>}
        </View>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.actionBtn} onPress={() => markAll()} activeOpacity={0.75}>
              <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
              <Text style={s.actionText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={handleClear} activeOpacity={0.75}>
            <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[s.list, notifications.length === 0 && s.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const cfg = TYPE_ICON[item.type] ?? { icon: "notifications", color: Colors.textMuted, bg: Colors.background };
            return (
              <TouchableOpacity
                style={[s.item, !item.isRead && s.itemUnread]}
                onPress={() => { if (!item.isRead) markRead(item.id); }}
                activeOpacity={0.75}
              >
                <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as never} size={20} color={cfg.color} />
                </View>
                <View style={s.itemBody}>
                  <View style={s.itemTop}>
                    <Text style={[s.itemTitle, !item.isRead && s.itemTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={s.itemMsg} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={s.dot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications" sub="You're all caught up!" />
          }
        />
      )}
    </SafeAreaView>
  );
}
