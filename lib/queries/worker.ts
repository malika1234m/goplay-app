import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  WorkerBookingsResponse, WorkerFacilityResponse, WorkerProfileResponse,
} from "@/types";

export function useWorkerBookings(params?: {
  date?:    string;
  status?:  string;
  history?: boolean;
  from?:    string;
  to?:      string;
}) {
  const qs = new URLSearchParams();
  if (params?.date)    qs.set("date",    params.date);
  if (params?.status)  qs.set("status",  params.status);
  if (params?.history) qs.set("history", "true");
  if (params?.from)    qs.set("from",    params.from);
  if (params?.to)      qs.set("to",      params.to);
  const query = qs.toString();

  return useQuery({
    queryKey: ["worker", "bookings", params ?? {}],
    queryFn:  () =>
      api.get<WorkerBookingsResponse>(`/api/worker/bookings${query ? `?${query}` : ""}`),
    staleTime: 30_000,
  });
}

export function useUpdateWorkerBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cashReceived }: {
      id: string; status: string; cashReceived?: boolean;
    }) => api.put(`/api/worker/bookings/${id}/status`, { status, cashReceived }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker", "bookings"] }),
  });
}

export function useCreateWalkIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      courtId?:        string;
      bookingDate:     string;
      startTime:       string;
      endTime:         string;
      playerName:      string;
      contactNumber?:  string;
      specialRequests?:string;
    }) => api.post("/api/worker/bookings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker", "bookings"] }),
  });
}

export function useWorkerFacility() {
  return useQuery({
    queryKey: ["worker", "facility"],
    queryFn:  () => api.get<WorkerFacilityResponse>("/api/worker/facility"),
    staleTime: 5 * 60_000,
  });
}

export function useWorkerProfile() {
  return useQuery({
    queryKey: ["worker", "profile"],
    queryFn:  () => api.get<WorkerProfileResponse>("/api/worker/profile"),
    staleTime: 60_000,
  });
}

export function useUpdateWorkerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; phone?: string }) =>
      api.put("/api/worker/profile", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker", "profile"] }),
  });
}
