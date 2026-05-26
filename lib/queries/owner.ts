import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BookingsResponse, StatsResponse, GroundsResponse, Court } from "@/types";

export interface OwnerProfileResponse {
  user: {
    name: string; email: string; phone: string | null; createdAt: string;
    groundOwnerProfile: {
      id: string; businessName: string | null; bio: string | null;
      address: string | null; city: string | null; phone: string | null;
    } | null;
  };
  stats: {
    totalGrounds: number; activeGrounds: number; pendingGrounds: number;
    totalBookings: number; totalReviews: number;
  };
}

export function useOwnerProfile() {
  return useQuery({
    queryKey: ["owner", "profile"],
    queryFn:  () => api.get<OwnerProfileResponse>("/api/ground-owner/profile"),
    staleTime: 60_000,
  });
}

export function useUpdateOwnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string; phone?: string;
      businessName?: string; bio?: string; address?: string; city?: string;
    }) => api.put("/api/ground-owner/profile", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "profile"] }); },
  });
}

export function useOwnerStats() {
  return useQuery({
    queryKey: ["owner", "stats"],
    queryFn:  () => api.get<StatsResponse>("/api/ground-owner/stats"),
    staleTime: 30_000,
  });
}

export function useOwnerBookings(params?: {
  status?:  string;
  history?: boolean;
  from?:    string;
  to?:      string;
  page?:    number;
}) {
  const qs = new URLSearchParams();
  if (params?.status)  qs.set("status",  params.status);
  if (params?.history) qs.set("history", "true");
  if (params?.from)    qs.set("from",    params.from);
  if (params?.to)      qs.set("to",      params.to);
  if (params?.page)    qs.set("page",    String(params.page));

  const query = qs.toString();

  return useQuery({
    queryKey: ["owner", "bookings", params ?? {}],
    queryFn:  () => api.get<BookingsResponse>(`/api/ground-owner/bookings${query ? `?${query}` : ""}`),
    staleTime: 30_000,
  });
}

export function useOwnerGrounds() {
  return useQuery({
    queryKey: ["owner", "grounds"],
    queryFn:  () => api.get<GroundsResponse>("/api/ground-owner/grounds"),
    staleTime: 60_000,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cashReceived }: {
      id:           string;
      status:       string;
      cashReceived?: boolean;
    }) => api.put(`/api/ground-owner/bookings/${id}/status`, { status, cashReceived }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner"] });
    },
  });
}

export function useMarkNoShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put(`/api/ground-owner/bookings/${id}/noshow`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner"] });
    },
  });
}

export function useGroundCourts(groundId: string | null) {
  return useQuery({
    queryKey: ["owner", "courts", groundId],
    queryFn:  () => api.get<{ courts: Court[] }>(`/api/ground-owner/grounds/${groundId}/courts`),
    enabled:  !!groundId,
    staleTime: 60_000,
  });
}

export function useCreateGround() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name:         string;
      description?: string;
      address:      string;
      city:         string;
      hourlyRate:   number;
      capacity?:    number;
      amenities?:   string[];
      categoryIds:  string[];
    }) => api.post("/api/ground-owner/grounds", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner", "grounds"] });
    },
  });
}

export function useCreateOwnerWalkIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      facilityId:     string;
      courtId?:       string | null;
      bookingDate:    string;
      startTime:      string;
      endTime:        string;
      playerName:     string;
      contactNumber?: string;
      notes?:         string;
    }) => api.post("/api/ground-owner/bookings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner"] });
    },
  });
}
