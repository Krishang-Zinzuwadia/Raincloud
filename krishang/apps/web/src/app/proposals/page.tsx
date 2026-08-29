"use client";

import type { Proposal } from "@repo/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ProposalsPage() {
  const { data } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => api<{ data: Proposal[] }>("/v1/servers/server-1/proposals"),
  });
  const approve = useMutation({
    mutationFn: (id: string) => api(`/v1/proposals/${id}/approve`, { method: "POST" }),
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Proposals</h1>
      {data?.data.map((proposal) => (
        <article key={proposal.id} className="mb-4 rounded-lg bg-[var(--card)] p-4">
          <p>{proposal.rationale}</p>
          <p className="text-sm text-[var(--muted)]">
            confidence {proposal.confidence} · {proposal.status}
          </p>
          <button
            className="mt-3 rounded bg-[var(--ok)] px-3 py-1 text-black"
            onClick={() => approve.mutate(proposal.id)}
            type="button"
          >
            Approve and deploy
          </button>
        </article>
      ))}
    </div>
  );
}
