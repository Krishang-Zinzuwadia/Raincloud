import { Type, type Static } from "@sinclair/typebox";

/** Rule documents are validated by plugin-builder/validation.ts, not re-derived here. */
export const RuleDocument = Type.Unknown({
  $id: "PluginBuilderBody",
  description: "Rule JSON. Semantics enforced only by validation.ts.",
});
export type RuleDocument = Static<typeof RuleDocument>;

export const DeploymentState = Type.Union([
  Type.Literal("idle"),
  Type.Literal("building"),
  Type.Literal("staging"),
  Type.Literal("presync"),
  Type.Literal("freezing"),
  Type.Literal("verifying"),
  Type.Literal("cutover"),
  Type.Literal("draining"),
  Type.Literal("failed"),
  Type.Literal("aborted"),
]);
export type DeploymentState = Static<typeof DeploymentState>;

export const RuleSource = Type.Union([
  Type.Literal("form"),
  Type.Literal("agent"),
  Type.Literal("director"),
]);
export type RuleSource = Static<typeof RuleSource>;

export const ProposalStatus = Type.Union([
  Type.Literal("pending"),
  Type.Literal("approved"),
  Type.Literal("rejected"),
]);
export type ProposalStatus = Static<typeof ProposalStatus>;

export const GameType = Type.Literal("minecraft");
export type GameType = Static<typeof GameType>;

export const RuleRegistryDto = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  gameType: GameType,
  jsonUrl: Type.String({ format: "uri" }),
  version: Type.Optional(Type.String()),
});
export type RuleRegistryDto = Static<typeof RuleRegistryDto>;

export const RuleSetVersion = Type.Object({
  id: Type.String({ format: "uuid" }),
  ruleSetId: Type.String(),
  version: Type.Integer({ minimum: 1 }),
  jsonUrl: Type.String(),
  contentDigest: Type.String(),
  builtJarUrl: Type.String(),
  source: RuleSource,
  sourcePrompt: Type.Union([Type.String(), Type.Null()]),
  createdBy: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
});
export type RuleSetVersion = Static<typeof RuleSetVersion>;

export const Deployment = Type.Object({
  id: Type.String({ format: "uuid" }),
  serverId: Type.String(),
  fromVersion: Type.Union([Type.String(), Type.Null()]),
  toVersion: Type.String(),
  state: DeploymentState,
  candidatePod: Type.Union([Type.String(), Type.Null()]),
  snapshotId: Type.Union([Type.String(), Type.Null()]),
  playerVisibleMs: Type.Union([Type.Integer(), Type.Null()]),
  approvedBy: Type.Union([Type.String(), Type.Null()]),
  approvalTokenHash: Type.Union([Type.String(), Type.Null()]),
  initiatedBy: Type.String(),
  startedAt: Type.String({ format: "date-time" }),
  finishedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  error: Type.Union([Type.String(), Type.Null()]),
  queuePosition: Type.Union([Type.Integer(), Type.Null()]),
});
export type Deployment = Static<typeof Deployment>;

export const ApprovalMintRequest = Type.Object({
  serverId: Type.String(),
  ruleSetVersion: Type.String(),
  contentDigest: Type.String(),
  issuedTo: Type.String(),
});
export type ApprovalMintRequest = Static<typeof ApprovalMintRequest>;

export const ApprovalMintResponse = Type.Object({
  token: Type.String(),
  serverId: Type.String(),
  ruleSetVersion: Type.String(),
  contentDigest: Type.String(),
  issuedTo: Type.String(),
  issuedBy: Type.String(),
  issuedAt: Type.String({ format: "date-time" }),
  expiresAt: Type.String({ format: "date-time" }),
  singleUse: Type.Literal(true),
});
export type ApprovalMintResponse = Static<typeof ApprovalMintResponse>;

export const StructuredRefusal = Type.Object({
  code: Type.Union([
    Type.Literal("approval_required"),
    Type.Literal("approval_expired"),
    Type.Literal("approval_consumed"),
    Type.Literal("approval_principal_mismatch"),
    Type.Literal("approval_digest_mismatch"),
    Type.Literal("approval_human_only"),
    Type.Literal("approval_not_found"),
  ]),
  message: Type.String(),
  missing: Type.Literal("approval_token"),
});
export type StructuredRefusal = Static<typeof StructuredRefusal>;

export const ApprovalRedemptionResult = Type.Union([
  Type.Object({ ok: Type.Literal(true), tokenHash: Type.String() }),
  Type.Object({ ok: Type.Literal(false), refusal: StructuredRefusal }),
]);
export type ApprovalRedemptionResult = Static<typeof ApprovalRedemptionResult>;

export const Proposal = Type.Object({
  id: Type.String({ format: "uuid" }),
  serverId: Type.String(),
  suggestedRules: RuleDocument,
  rationale: Type.String(),
  confidence: Type.Number({ minimum: 0, maximum: 1 }),
  status: ProposalStatus,
  reviewedBy: Type.Union([Type.String(), Type.Null()]),
  reviewedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  rejectionReason: Type.Union([Type.String(), Type.Null()]),
});
export type Proposal = Static<typeof Proposal>;

export const WorldEventsRollup = Type.Object({
  serverId: Type.String(),
  windowStart: Type.String({ format: "date-time" }),
  windowEnd: Type.String({ format: "date-time" }),
  metrics: Type.Record(Type.String(), Type.Number()),
});
export type WorldEventsRollup = Static<typeof WorldEventsRollup>;

export const SseEventType = Type.Union([
  Type.Literal("deployment.transition"),
  Type.Literal("world.event"),
  Type.Literal("proposal.notification"),
  Type.Literal("log.line"),
]);
export type SseEventType = Static<typeof SseEventType>;

export const SseEventEnvelope = Type.Object({
  id: Type.String(),
  type: SseEventType,
  timestamp: Type.String({ format: "date-time" }),
  payload: Type.Unknown(),
});
export type SseEventEnvelope = Static<typeof SseEventEnvelope>;

export const DeploymentTransitionPayload = Type.Object({
  deploymentId: Type.String(),
  state: DeploymentState,
  queuePosition: Type.Union([Type.Integer(), Type.Null()]),
  playerVisibleMs: Type.Union([Type.Integer(), Type.Null()]),
  error: Type.Optional(Type.String()),
});
export type DeploymentTransitionPayload = Static<typeof DeploymentTransitionPayload>;

export const NdjsonDeploymentEvent = Type.Object({
  deploymentId: Type.String(),
  state: DeploymentState,
  timestamp: Type.String({ format: "date-time" }),
  queuePosition: Type.Union([Type.Integer(), Type.Null()]),
});
export type NdjsonDeploymentEvent = Static<typeof NdjsonDeploymentEvent>;

export const AuthorRulesRequest = Type.Object({
  prompt: Type.String({ minLength: 1 }),
});
export type AuthorRulesRequest = Static<typeof AuthorRulesRequest>;

export const AuthorRulesResponse = Type.Object({
  version: RuleSetVersion,
});
export type AuthorRulesResponse = Static<typeof AuthorRulesResponse>;

export const PreviewRequest = Type.Object({
  fromVersion: Type.String(),
  toVersion: Type.String(),
});
export type PreviewRequest = Static<typeof PreviewRequest>;

export const PreviewResponse = Type.Object({
  semanticDiff: Type.Array(Type.String()),
  estimatedPlayerVisible: Type.Union([
    Type.Literal("unmeasured"),
    Type.Object({ ms: Type.Integer() }),
  ]),
  quotaImpact: Type.Object({
    extraCpu: Type.Number(),
    extraRamGi: Type.Number(),
  }),
  rollbackTarget: RuleSetVersion,
});
export type PreviewResponse = Static<typeof PreviewResponse>;

export const DeployRequest = Type.Object({
  toVersion: Type.String(),
  approvalToken: Type.String(),
});
export type DeployRequest = Static<typeof DeployRequest>;

export const RestoreRequest = Type.Object({
  snapshotId: Type.String(),
  confirmDataLoss: Type.Literal(true),
  sinceIso: Type.String({ format: "date-time" }),
});
export type RestoreRequest = Static<typeof RestoreRequest>;

export const RejectProposalRequest = Type.Object({
  reason: Type.String({ minLength: 1 }),
});
export type RejectProposalRequest = Static<typeof RejectProposalRequest>;

export const ServerSummary = Type.Object({
  id: Type.String(),
  name: Type.String(),
  address: Type.String(),
  currentState: Type.String(),
  deploymentState: DeploymentState,
  playerCount: Type.Integer(),
  tps: Type.Number(),
});
export type ServerSummary = Static<typeof ServerSummary>;

export const MachineTokenCreated = Type.Object({
  id: Type.String(),
  name: Type.String(),
  token: Type.String(),
});
export type MachineTokenCreated = Static<typeof MachineTokenCreated>;

export const CONTRACTS_VERSION = "1.0.0" as const;

export * from "./digest.ts";
