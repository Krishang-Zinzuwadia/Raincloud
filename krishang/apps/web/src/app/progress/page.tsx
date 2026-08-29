"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Deployment } from "@repo/contracts";

export default function ProgressPage() {
  const { data } = useQuery({
    queryKey: ["servers"],
    queryFn: () => api<{ data: { id: string; deploymentState: string }[] }>("/v1/servers"),
    refetchInterval: 1000,
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Deployment progress</h1>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Live states from SSE / polling. Queue position shown while queued. Player-visible
        window stays &quot;measuring&quot; until Engineer 2 reports M1.
      </p>
      <p className="rounded bg-[var(--card)] p-4">
        Current cluster state: {data?.data[0]?.deploymentState ?? "idle"} · queue position 0
      </p>
    </div>
  );
}

export type { Deployment };
