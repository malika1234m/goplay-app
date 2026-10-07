import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GroundPaymentDetails, InboxResponse, PaymentItem, PaymentsResponse, RefundItem } from "@/types";

// "Pay online" is a bank transfer to the ground. Players upload a receipt; owners and their
// workers confirm or reject it here. Same endpoints serve both roles.

export type PaymentFilter = "review" | "rejected" | "confirmed" | "all";

export function usePayments(filter: PaymentFilter = "review") {
  return useQuery({
    queryKey: ["payments", filter],
    queryFn:  () => api.get<PaymentsResponse>(`/api/ground-owner/payments?filter=${filter}`),
    staleTime: 15_000,
  });
}

export function useRefundsDue() {
  return useQuery({
    queryKey: ["payments", "refunds"],
    queryFn:  () => api.get<{ refunds: RefundItem[] }>("/api/ground-owner/payments?filter=refunds"),
    staleTime: 30_000,
  });
}

function useInvalidatePayments() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["payments"] });
    qc.invalidateQueries({ queryKey: ["owner"] });
    qc.invalidateQueries({ queryKey: ["worker"] });
  };
}

export function useReviewPayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: ({ item, action, reason }: { item: Pick<PaymentItem, "kind" | "id">; action: "confirm" | "reject"; reason?: string }) =>
      api.post<{ message: string }>(`/api/ground-owner/payments/${item.kind}/${item.id}`, { action, reason: reason || undefined }),
    onSuccess: invalidate,
  });
}

export function useMarkRefunded() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: ({ bookingId, note }: { bookingId: string; note?: string }) =>
      api.post<{ message: string }>(`/api/ground-owner/bookings/${bookingId}/refund`, { note: note || undefined }),
    onSuccess: invalidate,
  });
}

export function useGroundPaymentDetails(groundId: string) {
  return useQuery({
    queryKey: ["owner", "ground-payment-details", groundId],
    queryFn:  () => api.get<{ paymentDetails: GroundPaymentDetails }>(`/api/ground-owner/grounds/${groundId}/payment-details`),
    enabled:  !!groundId,
  });
}

export function useSaveGroundPaymentDetails(groundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GroundPaymentDetails) => api.put(`/api/ground-owner/grounds/${groundId}/payment-details`, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["owner", "ground-payment-details", groundId] }),
  });
}

/** Everything the ground needs to act on: receipts, cash requests, refunds, awaited transfers. */
export function useInbox(facilityId?: string) {
  return useQuery({
    queryKey: ["payments", "inbox", facilityId ?? "all"],
    queryFn:  () => api.get<InboxResponse>(`/api/ground-owner/inbox${facilityId ? `?facilityId=${facilityId}` : ""}`),
    staleTime: 15_000,
  });
}

export function useConfirmCashBooking(role: "GROUND_OWNER" | "GROUND_WORKER") {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (bookingId: string) =>
      api.put(role === "GROUND_OWNER" ? `/api/ground-owner/bookings/${bookingId}/status` : `/api/worker/bookings/${bookingId}/status`, { status: "CONFIRMED" }),
    onSuccess: invalidate,
  });
}
