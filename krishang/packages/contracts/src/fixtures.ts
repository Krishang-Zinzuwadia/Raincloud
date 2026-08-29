import type {
  ApprovalMintRequest,
  ApprovalMintResponse,
  AuthorRulesResponse,
  Deployment,
  DeployRequest,
  PreviewResponse,
  Proposal,
  RestoreRequest,
  RuleRegistryDto,
  RuleSetVersion,
  ServerSummary,
  SseEventEnvelope,
  StructuredRefusal,
  WorldEventsRollup,
} from "./index.ts";

export const sampleRuleJsonV1 = {
  metadata: { pluginName: "SpawnWelcome", minecraftVersion: "1.20.4" },
  onPlayerJoin: {
    privateMessage: "Welcome to the world.",
    broadcastMessage: "{player} joined.",
    startingItems: [{ material: "BREAD", amount: 4 }],
    potionEffects: [{ type: "SPEED", durationTicks: 200, amplifier: 0 }],
  },
  onPlayerQuit: { broadcastMessage: "{player} left." },
  onPlayerAction: {
    triggerAction: "BREAK_DIAMOND_ORE",
    achievement: {
      title: "Miner",
      description: "Break diamond ore",
      soundEffect: "ENTITY_PLAYER_LEVELUP",
    },
  },
};

export const sampleRuleJsonV2 = {
  ...sampleRuleJsonV1,
  onPlayerJoin: {
    ...sampleRuleJsonV1.onPlayerJoin,
    privateMessage: "Welcome back.",
    startingItems: [
      { material: "BREAD", amount: 4 },
      { material: "DIAMOND", amount: 1 },
    ],
  },
};

export const sampleRuleRegistry: RuleRegistryDto = {
  name: "spawn-welcome",
  description: "Join kit and miner achievement",
  gameType: "minecraft",
  jsonUrl: "s3://farlands-rules/write-once/rule-set-1/v2.json",
  version: "2",
};

export const sampleRuleSetVersionV1: RuleSetVersion = {
  id: "00000000-0000-4000-8000-0000000000a1",
  ruleSetId: "rule-set-1",
  version: 1,
  jsonUrl: "s3://farlands-rules/write-once/rule-set-1/v1.json",
  contentDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
  builtJarUrl: "s3://farlands-rules/write-once/rule-set-1/v1.jar",
  source: "form",
  sourcePrompt: null,
  createdBy: "user:owner-1",
  createdAt: "2026-08-01T12:00:00.000Z",
};

export const sampleRuleSetVersionV2: RuleSetVersion = {
  id: "00000000-0000-4000-8000-0000000000a2",
  ruleSetId: "rule-set-1",
  version: 2,
  jsonUrl: "s3://farlands-rules/write-once/rule-set-1/v2.json",
  contentDigest: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
  builtJarUrl: "s3://farlands-rules/write-once/rule-set-1/v2.jar",
  source: "agent",
  sourcePrompt: "Give joiners a diamond and a warmer welcome",
  createdBy: "user:owner-1",
  createdAt: "2026-08-02T12:00:00.000Z",
};

export const sampleDeploymentBuilding: Deployment = {
  id: "00000000-0000-4000-8000-0000000000d1",
  serverId: "server-1",
  fromVersion: sampleRuleSetVersionV1.id,
  toVersion: sampleRuleSetVersionV2.id,
  state: "building",
  candidatePod: null,
  snapshotId: "snap-1",
  playerVisibleMs: null,
  approvedBy: "user:owner-1",
  approvalTokenHash: "sha256:tokenhash",
  initiatedBy: "machine:cli-1",
  startedAt: "2026-08-02T12:05:00.000Z",
  finishedAt: null,
  error: null,
  queuePosition: 0,
};

export const sampleApprovalMintRequest: ApprovalMintRequest = {
  serverId: "server-1",
  ruleSetVersion: sampleRuleSetVersionV2.id,
  contentDigest: sampleRuleSetVersionV2.contentDigest,
  issuedTo: "flk_cli-1",
};

export const sampleApprovalMintResponse: ApprovalMintResponse = {
  token: "apv_example_returned_once",
  serverId: "server-1",
  ruleSetVersion: sampleRuleSetVersionV2.id,
  contentDigest: sampleRuleSetVersionV2.contentDigest,
  issuedTo: "flk_cli-1",
  issuedBy: "user:owner-1",
  issuedAt: "2026-08-02T12:04:00.000Z",
  expiresAt: "2026-08-02T12:14:00.000Z",
  singleUse: true,
};

export const sampleRefusal: StructuredRefusal = {
  code: "approval_required",
  message: "Act-class operations require a human-minted approval token.",
  missing: "approval_token",
};

export const sampleProposal: Proposal = {
  id: "00000000-0000-4000-8000-0000000000p1",
  serverId: "server-1",
  suggestedRules: sampleRuleJsonV2,
  rationale: "Players linger at spawn; a join kit may help the first minute.",
  confidence: 0.72,
  status: "pending",
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
};

export const sampleRollup: WorldEventsRollup = {
  serverId: "server-1",
  windowStart: "2026-08-02T11:00:00.000Z",
  windowEnd: "2026-08-02T12:00:00.000Z",
  metrics: { joins: 12, deaths: 3, chatMessages: 40, tpsMin: 19.4 },
};

export const sampleSseEnvelope: SseEventEnvelope = {
  id: "42",
  type: "deployment.transition",
  timestamp: "2026-08-02T12:05:01.000Z",
  payload: {
    deploymentId: sampleDeploymentBuilding.id,
    state: "building",
    queuePosition: 0,
    playerVisibleMs: null,
  },
};

export const sampleServer: ServerSummary = {
  id: "server-1",
  name: "amber-smp",
  address: "server-1.mc.farlands.cloud:25565",
  currentState: "running",
  deploymentState: "idle",
  playerCount: 8,
  tps: 19.8,
};

export const sampleAuthorResponse: AuthorRulesResponse = {
  version: sampleRuleSetVersionV2,
};

export const samplePreview: PreviewResponse = {
  semanticDiff: [
    "join private message: Welcome to the world. -> Welcome back.",
    "join starting items: + DIAMOND x1",
  ],
  estimatedPlayerVisible: "unmeasured",
  quotaImpact: { extraCpu: 2, extraRamGi: 2 },
  rollbackTarget: sampleRuleSetVersionV1,
};

export const sampleDeployRequest: DeployRequest = {
  toVersion: sampleRuleSetVersionV2.id,
  approvalToken: sampleApprovalMintResponse.token,
};

export const sampleRestoreRequest: RestoreRequest = {
  snapshotId: "snap-1",
  confirmDataLoss: true,
  sinceIso: "2026-08-02T12:05:00.000Z",
};
