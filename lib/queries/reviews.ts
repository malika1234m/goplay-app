import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReviewsResponse } from "@/types";

export function useReviews(params?: {
  rating?:   number;
  reported?: "yes" | "no";
  sort?:     "newest" | "highest" | "lowest";
  page?:     number;
}) {
  const qs = new URLSearchParams();
  if (params?.rating)   qs.set("rating",   String(params.rating));
  if (params?.reported) qs.set("reported",  params.reported);
  if (params?.sort)     qs.set("sort",      params.sort);
  if (params?.page)     qs.set("page",      String(params.page));
  const query = qs.toString();

  return useQuery({
    queryKey: ["owner", "reviews", params ?? {}],
    queryFn:  () =>
      api.get<ReviewsResponse>(`/api/ground-owner/reviews${query ? `?${query}` : ""}`),
    staleTime: 30_000,
  });
}

export function useReportReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/api/ground-owner/reviews/${id}/report`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "reviews"] }),
  });
}

export function useUnreportReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/ground-owner/reviews/${id}/report`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "reviews"] }),
  });
}
