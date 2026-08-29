import { randomBytes, randomUUID } from "node:crypto";
import {
  hashToken,
  type ApprovalMintResponse,
  type Deployment,
  type DeploymentState,
  type Proposal,
  type RuleSetVersion,
  type ServerSummary,
  type SseEventEnvelope,
  type StructuredRefusal,
} from "@repo/contracts";
import {
  sampleProposal,
  sampleRuleJsonV1,
  sampleRuleJsonV2,
  sampleRuleSetVersionV1,
  sampleRuleSetVersionV2,
  sampleServer,
} from "@repo/contracts/fixtures";
import { buildRuleJar, semanticDiff, type PluginBuilderBody } from "@repo/plugin-builder";

const SCRIPT: DeploymentState[] = [
  "building",
  "staging",
  "presync",
  "freezing",
  "verifying",
  "cutover",
  "draining",
  "idle",
];

export type StoredToken = {
  tokenHash: string;
  serverId: string;
  ruleSetVersion: string;
  contentDigest: string;
  issuedTo: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
};

export class Store {
  servers: ServerSummary[] = [{ ...sampleServer }];
  versions = new Map<string, RuleSetVersion>([
    [sampleRuleSetVersionV1.id, sampleRuleSetVersionV1],
    [sampleRuleSetVersionV2.id, sampleRuleSetVersionV2],
  ]);
  documents = new Map<string, PluginBuilderBody>([
    [sampleRuleSetVersionV1.id, sampleRuleJsonV1],
    [sampleRuleSetVersionV2.id, sampleRuleJsonV2],
  ]);
  tokens = new Map<string, StoredToken>();
  deployments = new Map<string, Deployment>();
  proposals: Proposal[] = [{ ...sampleProposal }];
  events: SseEventEnvelope[] = [];
  eventSeq = 0;
  machineTokens = new Map<string, { userId: string; name: string }>([
    [hashToken("flk_cli-1"), { userId: "user:owner-1", name: "cli-1" }],
  ]);
  humans = new Set(["user:owner-1"]);

  constructor() {
    this.pushEvent("world.event", {
      kind: "join",
      player: "alex",
    });
  }

  nextId(): string {
    this.eventSeq += 1;
    return String(this.eventSeq);
  }

  pushEvent(type: SseEventEnvelope["type"], payload: unknown): SseEventEnvelope {
    const envelope: SseEventEnvelope = {
      id: this.nextId(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.events.push(envelope);
    if (this.events.length > 500) this.events.shift();
    return envelope;
  }

  eventsAfter(lastEventId: string | undefined): SseEventEnvelope[] {
    if (!lastEventId) return [...this.events];
    const idx = this.events.findIndex((e) => e.id === lastEventId);
    if (idx === -1) return [...this.events];
    return this.events.slice(idx + 1);
  }

  mint(input: {
    serverId: string;
    ruleSetVersion: string;
    contentDigest: string;
    issuedTo: string;
    issuedBy: string;
  }): ApprovalMintResponse {
    const version = this.versions.get(input.ruleSetVersion);
    if (!version) throw new Error("unknown version");
    const token = `apv_${randomBytes(24).toString("hex")}`;
    const tokenHash = hashToken(token);
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000);
    this.tokens.set(tokenHash, {
      tokenHash,
      serverId: input.serverId,
      ruleSetVersion: input.ruleSetVersion,
      contentDigest: input.contentDigest,
      issuedTo: input.issuedTo,
      issuedBy: input.issuedBy,
      issuedAt,
      expiresAt,
      consumedAt: null,
    });
    return {
      token,
      serverId: input.serverId,
      ruleSetVersion: input.ruleSetVersion,
      contentDigest: input.contentDigest,
      issuedTo: input.issuedTo,
      issuedBy: input.issuedBy,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      singleUse: true,
    };
  }

  redeem(
    token: string,
    principal: string,
    artefactDigest: string
  ): { ok: true; tokenHash: string } | { ok: false; refusal: StructuredRefusal } {
    const tokenHash = hashToken(token);
    const row = this.tokens.get(tokenHash);
    if (!row) {
      return {
        ok: false,
        refusal: {
          code: "approval_not_found",
          message: "Unknown approval token.",
          missing: "approval_token",
        },
      };
    }
    if (row.consumedAt) {
      return {
        ok: false,
        refusal: {
          code: "approval_consumed",
          message: "Approval token already used.",
          missing: "approval_token",
        },
      };
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      return {
        ok: false,
        refusal: {
          code: "approval_expired",
          message: "Approval token expired.",
          missing: "approval_token",
        },
      };
    }
    if (row.issuedTo !== principal) {
      return {
        ok: false,
        refusal: {
          code: "approval_principal_mismatch",
          message: "Token is not redeemable by this principal.",
          missing: "approval_token",
        },
      };
    }
    if (row.contentDigest !== artefactDigest) {
      return {
        ok: false,
        refusal: {
          code: "approval_digest_mismatch",
          message: "Token digest does not match the built artefact.",
          missing: "approval_token",
        },
      };
    }
    row.consumedAt = new Date();
    return { ok: true, tokenHash };
  }

  async author(serverId: string, prompt: string, createdBy: string): Promise<RuleSetVersion> {
    const built = await buildRuleJar(sampleRuleJsonV2);
    const version: RuleSetVersion = {
      id: randomUUID(),
      ruleSetId: `rules-${serverId}`,
      version: this.versions.size + 1,
      jsonUrl: built.jarUrl.replace(/\.jar$/, ".json"),
      contentDigest: built.contentDigest,
      builtJarUrl: built.jarUrl,
      source: "agent",
      sourcePrompt: prompt,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    this.versions.set(version.id, version);
    this.documents.set(version.id, sampleRuleJsonV2);
    return version;
  }

  startScriptedDeploy(serverId: string, toVersion: string, initiatedBy: string, tokenHash: string): Deployment {
    const id = randomUUID();
    const deployment: Deployment = {
      id,
      serverId,
      fromVersion: sampleRuleSetVersionV1.id,
      toVersion,
      state: "building",
      candidatePod: `${serverId}-candidate`,
      snapshotId: "snap-mock",
      playerVisibleMs: null,
      approvedBy: "user:owner-1",
      approvalTokenHash: tokenHash,
      initiatedBy,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      queuePosition: 0,
    };
    this.deployments.set(id, deployment);
    this.pushEvent("deployment.transition", {
      deploymentId: id,
      state: "building",
      queuePosition: 0,
      playerVisibleMs: null,
    });
    void this.walk(id);
    return deployment;
  }

  private async walk(id: string) {
    for (const state of SCRIPT.slice(1)) {
      await Bun.sleep(400);
      const row = this.deployments.get(id);
      if (!row || row.state === "aborted") return;
      row.state = state;
      if (state === "idle") {
        row.finishedAt = new Date().toISOString();
        row.playerVisibleMs = null;
      }
      this.pushEvent("deployment.transition", {
        deploymentId: id,
        state,
        queuePosition: state === "staging" ? 1 : 0,
        playerVisibleMs: null,
      });
    }
  }
}

export const store = new Store();
