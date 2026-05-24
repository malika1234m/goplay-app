import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadFormData } from "@/lib/api";
import type {
  GroundDetail, Court, AvailabilityDay, BlockedDate, Category,
} from "@/types";

// ── Ground detail & edit ─────────────────────────────────────────────────────

export function useGround(id: string) {
  return useQuery({
    queryKey: ["owner", "ground", id],
    queryFn:  () => api.get<{ ground: GroundDetail }>(`/api/ground-owner/grounds/${id}`),
    enabled:  !!id,
  });
}

export function useUpdateGround(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<GroundDetail> & { categoryIds?: string[] }) =>
      api.put(`/api/ground-owner/grounds/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner", "ground", id] });
      qc.invalidateQueries({ queryKey: ["owner", "grounds"] });
    },
  });
}

// ── Categories (public) ──────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn:  () => api.get<{ categories: Category[] }>("/api/categories"),
    staleTime: 5 * 60_000,
  });
}

// ── Courts ───────────────────────────────────────────────────────────────────

export function useCourts(facilityId: string) {
  return useQuery({
    queryKey: ["owner", "courts", facilityId],
    queryFn:  () => api.get<{ courts: Court[] }>(`/api/ground-owner/grounds/${facilityId}/courts`),
    enabled:  !!facilityId,
  });
}

export function useAddCourt(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      api.post<{ court: Court }>(`/api/ground-owner/grounds/${facilityId}/courts`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "courts", facilityId] }),
  });
}

export function useUpdateCourt(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courtId, ...body }: { courtId: string; name?: string; description?: string; isActive?: boolean }) =>
      api.put<{ court: Court }>(`/api/ground-owner/grounds/${facilityId}/courts/${courtId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "courts", facilityId] }),
  });
}

export function useDeleteCourt(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courtId: string) =>
      api.delete(`/api/ground-owner/grounds/${facilityId}/courts/${courtId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "courts", facilityId] }),
  });
}

// ── Availability ─────────────────────────────────────────────────────────────

export function useAvailability(facilityId: string) {
  return useQuery({
    queryKey: ["owner", "availability", facilityId],
    queryFn:  () =>
      api.get<{ schedule: AvailabilityDay[] }>(`/api/ground-owner/availability?facilityId=${facilityId}`),
    enabled: !!facilityId,
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, schedule }: { facilityId: string; schedule: AvailabilityDay[] }) =>
      api.put("/api/ground-owner/availability", { facilityId, schedule }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["owner", "availability", vars.facilityId] });
    },
  });
}

// ── Image upload ─────────────────────────────────────────────────────────────

export function useUploadGroundImages() {
  return useMutation({
    mutationFn: async (assets: Array<{ uri: string; mimeType?: string | null; fileName?: string | null }>) => {
      const form = new FormData();
      for (const a of assets) {
        form.append("images", {
          uri:  a.uri,
          type: a.mimeType ?? "image/jpeg",
          name: a.fileName ?? "photo.jpg",
        } as any);
      }
      return uploadFormData<{ urls: string[] }>("/api/upload/ground-images", form);
    },
  });
}

// ── Blocked Dates ────────────────────────────────────────────────────────────

export function useBlockedDates(facilityId: string) {
  return useQuery({
    queryKey: ["owner", "blocked", facilityId],
    queryFn:  () =>
      api.get<{ blocked: BlockedDate[] }>(`/api/ground-owner/blocked-dates?facilityId=${facilityId}`),
    enabled: !!facilityId,
  });
}

export function useAddBlockedDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      facilityId: string; date: string;
      reason?: string; startTime?: string; endTime?: string;
    }) => api.post("/api/ground-owner/blocked-dates", body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["owner", "blocked", vars.facilityId] });
    },
  });
}

export function useDeleteBlockedDate(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/ground-owner/blocked-dates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "blocked", facilityId] }),
  });
}
