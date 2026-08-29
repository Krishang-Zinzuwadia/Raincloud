import { cors } from "@elysiajs/cors";
import {
  ApprovalMintRequest,
  AuthorRulesRequest,
  DeployRequest,
  hashToken,
  PreviewRequest,
  RejectProposalRequest,
  RestoreRequest,
} from "@repo/contracts";
import { sampleRuleSetVersionV1, sampleRuleSetVersionV2 } from "@repo/contracts/fixtures";
import { type PluginBuilderBody, semanticDiff } from "@repo/plugin-builder";
import { Elysia } from "elysia";
import pino from "pino";
import { store } from "./store.ts";

const log = pino({ name: "farlands-api" });

type Auth = { kind: "human"; id: string } | { kind: "machine"; id: string };

function principal(headers: Record<string, string | undefined>): Auth | null {
  const bearer = headers.authorization?.replace(/^Bearer /i, "");
  if (bearer?.startsWith("flk_")) {
    const meta = store.machineTokens.get(hashToken(bearer));
    if (meta) return { kind: "machine", id: bearer };
  }
  const human = headers["x-principal"];
  if (human && store.humans.has(human)) return { kind: "human", id: human };
  return null;
}

function sseFormat(events: ReturnType<typeof store.eventsAfter>): string {
  return events
    .map((event) => `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    .join("");
}

export const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ ok: true }))
  .get("/v1/servers", () => ({ data: store.servers }))
  .get("/v1/servers/:id", ({ params, set }) => {
    const server = store.servers.find((s) => s.id === params.id);
    if (!server) {
      set.status = 404;
      return { error: "not found" };
    }
    return { data: server };
  })
  .get("/v1/servers/:id/proposals", ({ params }) => ({
    data: store.proposals.filter((p) => p.serverId === params.id),
  }))
  .get("/v1/servers/:id/logs", () => ({
    data: ['[Paper] Done (12.4s)! For help, type "help"'],
  }))
  .get("/v1/servers/:id/events", ({ request }) => {
    const last = request.headers.get("Last-Event-ID") ?? undefined;
    const missed = store.eventsAfter(last);
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(sseFormat(missed)));
        let deliveredId = missed.at(-1)?.id ?? last;
        const timer = setInterval(() => {
          const latest = store.eventsAfter(deliveredId);
          if (latest.length) {
            controller.enqueue(encoder.encode(sseFormat(latest)));
            deliveredId = latest.at(-1)?.id;
          }
        }, 400);
        setTimeout(() => {
          clearInterval(timer);
          controller.close();
        }, 8_000);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  })
  .post(
    "/v1/approvals",
    ({ headers, body, set }) => {
      const auth = principal(headers);
      if (!auth) {
        set.status = 401;
        return { error: "Authentication required" };
      }
      if (auth.kind !== "human") {
        set.status = 403;
        return {
          code: "approval_human_only",
          message: "POST /v1/approvals accepts a human session only.",
          missing: "approval_token",
        };
      }
      const minted = store.mint({ ...body, issuedBy: auth.id });
      log.info({ minted: minted.ruleSetVersion, issuedBy: auth.id }, "approval minted");
      return minted;
    },
    { body: ApprovalMintRequest },
  )
  .post(
    "/v1/servers/:id/rule-sets/author",
    async ({ params, headers, body, set }) => {
      const auth = principal(headers);
      if (!auth) {
        set.status = 401;
        return { error: "Authentication required" };
      }
      const version = await store.author(params.id, body.prompt, auth.id);
      return { version };
    },
    { body: AuthorRulesRequest },
  )
  .post(
    "/v1/servers/:id/preview",
    ({ body }) => {
      const from = store.documents.get(body.fromVersion) ?? sampleRuleJsonV1;
      const to = store.documents.get(body.toVersion) ?? sampleRuleJsonV2;
      return {
        semanticDiff: semanticDiff(from as PluginBuilderBody, to as PluginBuilderBody),
        estimatedPlayerVisible: "unmeasured" as const,
        quotaImpact: { extraCpu: 2, extraRamGi: 2 },
        rollbackTarget: store.versions.get(body.fromVersion) ?? sampleRuleSetVersionV1,
      };
    },
    { body: PreviewRequest },
  )
  .post(
    "/v1/servers/:id/deploy",
    ({ params, headers, body, set }) => {
      const auth = principal(headers);
      if (!auth) {
        set.status = 401;
        return { error: "Authentication required" };
      }
      const version = store.versions.get(body.toVersion);
      if (!version) {
        set.status = 404;
        return { error: "unknown version" };
      }
      const result = store.redeem(body.approvalToken, auth.id, version.contentDigest);
      if (!result.ok) {
        set.status = 403;
        return result.refusal;
      }
      return {
        data: store.startScriptedDeploy(params.id, body.toVersion, auth.id, result.tokenHash),
      };
    },
    { body: DeployRequest },
  )
  .get("/v1/deployments/:id", ({ params, set }) => {
    const row = store.deployments.get(params.id);
    if (!row) {
      set.status = 404;
      return { error: "not found" };
    }
    return { data: row };
  })
  .post("/v1/deployments/:id/abort", ({ params, set }) => {
    const row = store.deployments.get(params.id);
    if (!row) {
      set.status = 404;
      return { error: "not found" };
    }
    if (row.state !== "cutover" && row.state !== "draining" && row.state !== "idle") {
      row.state = "aborted";
      row.finishedAt = new Date().toISOString();
      store.pushEvent("deployment.transition", {
        deploymentId: row.id,
        state: "aborted",
        queuePosition: null,
        playerVisibleMs: null,
      });
    }
    return { data: row };
  })
  .post("/v1/servers/:id/rollback", ({ params }) => ({
    data: {
      message: "Rule rollback queued. Play since the change is preserved.",
      target: sampleRuleSetVersionV1,
      serverId: params.id,
    },
  }))
  .post(
    "/v1/servers/:id/restore",
    ({ body }) => ({
      data: {
        warning: `This discards everything players did since ${body.sinceIso}.`,
        snapshotId: body.snapshotId,
      },
    }),
    { body: RestoreRequest },
  )
  .post("/v1/proposals/:id/approve", ({ params, headers, set }) => {
    const auth = principal(headers);
    if (auth?.kind !== "human") {
      set.status = 403;
      return {
        code: "approval_human_only",
        message: "Proposal approval is a human action.",
        missing: "approval_token",
      };
    }
    const proposal = store.proposals.find((p) => p.id === params.id);
    if (!proposal) {
      set.status = 404;
      return { error: "not found" };
    }
    proposal.status = "approved";
    proposal.reviewedBy = auth.id;
    proposal.reviewedAt = new Date().toISOString();
    const minted = store.mint({
      serverId: proposal.serverId,
      ruleSetVersion: sampleRuleSetVersionV2.id,
      contentDigest: sampleRuleSetVersionV2.contentDigest,
      issuedTo: auth.id,
      issuedBy: auth.id,
    });
    const redemption = store.redeem(minted.token, auth.id, sampleRuleSetVersionV2.contentDigest);
    if (!redemption.ok) {
      set.status = 403;
      return redemption.refusal;
    }
    const deployment = store.startScriptedDeploy(
      proposal.serverId,
      sampleRuleSetVersionV2.id,
      auth.id,
      redemption.tokenHash,
    );
    return { deployment };
  })
  .post(
    "/v1/proposals/:id/reject",
    ({ params, headers, body, set }) => {
      const auth = principal(headers);
      if (auth?.kind !== "human") {
        set.status = 403;
        return { error: "human session required" };
      }
      const proposal = store.proposals.find((p) => p.id === params.id);
      if (!proposal) {
        set.status = 404;
        return { error: "not found" };
      }
      proposal.status = "rejected";
      proposal.rejectionReason = body.reason;
      proposal.reviewedBy = auth.id;
      proposal.reviewedAt = new Date().toISOString();
      return { data: proposal };
    },
    { body: RejectProposalRequest },
  );

const port = Number(process.env.PORT ?? 3001);
if (import.meta.main) {
  app.listen(port);
  log.info({ port }, "mock API listening");
}
