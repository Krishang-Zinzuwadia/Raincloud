"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApprovalMintResponse, PreviewResponse } from "@repo/contracts";

const FROM = "00000000-0000-4000-8000-0000000000a1";
const TO = "00000000-0000-4000-8000-0000000000a2";

export default function ReviewPage() {
  const preview = useQuery({
    queryKey: ["preview"],
    queryFn: () =>
      api<PreviewResponse>("/v1/servers/server-1/preview", {
        method: "POST",
        body: JSON.stringify({ fromVersion: FROM, toVersion: TO }),
      }),
  });

  const approve = useMutation({
    mutationFn: () =>
      api<ApprovalMintResponse>("/v1/approvals", {
        method: "POST",
        body: JSON.stringify({
          serverId: "server-1",
          ruleSetVersion: TO,
          contentDigest:
            "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          issuedTo: "flk_cli-1",
        }),
      }),
  });

  const reject = useMutation({
    mutationFn: () =>
      api("/v1/proposals/00000000-0000-4000-8000-0000000000p1/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "Does not match what I wanted" }),
      }),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Review</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Semantic diff of two rule versions. Never a JSON patch.
      </p>
      <ul className="mb-6 space-y-2 font-mono text-sm">
        {preview.data?.semanticDiff.map((line) => (
          <li key={line} className="rounded bg-[var(--card)] p-3">
            {line}
          </li>
        ))}
      </ul>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Freeze window: measuring (waiting on Engineer 2 / M1).
      </p>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Approve mints a short-lived token. Rule rollback later stops the rule acting
        further; it does not undo diamonds already granted.
      </p>
      <div className="flex gap-3">
        <button
          className="rounded bg-[var(--ok)] px-4 py-2 text-black"
          onClick={() => approve.mutate()}
          type="button"
        >
          Approve
        </button>
        <button
          className="rounded border border-[var(--line)] px-4 py-2"
          onClick={() => reject.mutate()}
          type="button"
        >
          Reject
        </button>
      </div>
      {approve.data ? (
        <pre className="mt-4 overflow-auto text-xs">{JSON.stringify(approve.data, null, 2)}</pre>
      ) : null}
    </div>
  );
}
