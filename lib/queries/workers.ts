import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { WorkersResponse, Worker } from "@/types";

export function useWorkers(facilityId: string) {
  return useQuery({
    queryKey: ["owner", "workers", facilityId],
    queryFn:  () =>
      api.get<WorkersResponse>(`/api/ground-owner/workers?facilityId=${facilityId}`),
    enabled:  !!facilityId,
    staleTime: 30_000,
  });
}

export function useAddWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { facilityId: string; email: string; name?: string }) =>
      // An existing GoPlay account gets an invitation instead (invited: true) and joins once they accept
      api.post<{ worker: Worker; isNewAccount: boolean; tempPassword?: string; invited?: boolean; message?: string }>(
        "/api/ground-owner/workers",
        body
      ),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["owner", "workers", vars.facilityId] }),
  });
}

export function useWithdrawInvite(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api.delete(`/api/ground-owner/workers/invites/${inviteId}`),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["owner", "workers", facilityId] }),
  });
}

export function useRemoveWorker(facilityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) =>
      api.delete(`/api/ground-owner/workers/${workerId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["owner", "workers", facilityId] }),
  });
}
