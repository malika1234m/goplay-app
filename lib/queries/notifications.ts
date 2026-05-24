import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
  link?:     string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  total:         number;
  unreadCount:   number;
  page:          number;
  limit:         number;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn:  () => api.get<NotificationsResponse>("/api/notifications"),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put("/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/api/notifications"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
