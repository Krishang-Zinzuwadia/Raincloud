"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ServerSummary } from "@repo/contracts";

export default function ServersPage() {
  const { data } = useQuery({
    queryKey: ["servers"],
    queryFn: () => api<{ data: ServerSummary[] }>("/v1/servers"),
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Servers</h1>
      <ul className="space-y-3">
        {data?.data.map((server) => (
          <li key={server.id} className="rounded-lg bg-[var(--card)] p-4">
            <p className="font-medium">{server.name}</p>
            <p className="text-sm text-[var(--muted)]">{server.address}</p>
            <p className="text-sm">
              {server.playerCount} online · {server.tps} TPS · {server.deploymentState}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
