import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  EarningsResponse, TrendsResponse, PayoutResponse, BankDetails,
} from "@/types";

export type EarningsRange = "month" | "30d" | "90d" | "all";

export function useEarnings(range: EarningsRange = "month") {
  return useQuery({
    queryKey: ["owner", "earnings", range],
    queryFn:  () => api.get<EarningsResponse>(`/api/ground-owner/earnings?range=${range}`),
    staleTime: 60_000,
  });
}

export function useEarningsTrends(days: 7 | 30 | 90 = 30) {
  return useQuery({
    queryKey: ["owner", "earnings-trends", days],
    queryFn:  () => api.get<TrendsResponse>(`/api/ground-owner/earnings/trends?days=${days}`),
    staleTime: 60_000,
  });
}

export function usePayoutData() {
  return useQuery({
    queryKey: ["owner", "payout"],
    queryFn:  () => api.get<PayoutResponse>("/api/ground-owner/payout"),
    staleTime: 30_000,
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/ground-owner/payout", {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["owner", "payout"] }),
  });
}

export function useBankDetails() {
  return useQuery({
    queryKey: ["owner", "bank-details"],
    queryFn:  () => api.get<{ bankDetails: BankDetails }>("/api/ground-owner/bank-details"),
    staleTime: 5 * 60_000,
  });
}

export function useSaveBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Required<BankDetails>) =>
      api.put("/api/ground-owner/bank-details", body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["owner", "bank-details"] });
      qc.invalidateQueries({ queryKey: ["owner", "payout"] });
    },
  });
}
