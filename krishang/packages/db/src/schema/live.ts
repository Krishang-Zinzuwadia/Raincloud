import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { gameServers } from "./servers";

export const ruleSourceEnum = pgEnum("rule_source", ["form", "agent", "director"]);

export const deploymentStateEnum = pgEnum("deployment_state", [
  "idle",
  "building",
  "staging",
  "presync",
  "freezing",
  "verifying",
  "cutover",
  "draining",
  "failed",
  "aborted",
]);

export const proposalStatusEnum = pgEnum("proposal_status", ["pending", "approved", "rejected"]);

export const experimentDesignEnum = pgEnum("experiment_design", ["pre_post", "parallel"]);

export const experimentArmEnum = pgEnum("experiment_arm", [
  "director",
  "human",
  "random_baseline",
]);

export const ruleSetVersions = pgTable(
  "rule_set_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleSetId: text("rule_set_id").notNull(),
    version: integer("version").notNull(),
    jsonUrl: text("json_url").notNull(),
    contentDigest: text("content_digest").notNull(),
    builtJarUrl: text("built_jar_url").notNull(),
    source: ruleSourceEnum("source").notNull(),
    sourcePrompt: text("source_prompt"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("rule_set_versions_set_version_idx").on(table.ruleSetId, table.version),
    uniqueIndex("rule_set_versions_json_url_idx").on(table.jsonUrl),
  ],
);

export const approvalTokens = pgTable(
  "approval_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => gameServers.id),
    ruleSetVersion: uuid("rule_set_version")
      .notNull()
      .references(() => ruleSetVersions.id),
    contentDigest: text("content_digest").notNull(),
    issuedTo: text("issued_to").notNull(),
    issuedBy: text("issued_by").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [index("approval_tokens_server_idx").on(table.serverId)],
);

export const deployments = pgTable(
  "deployments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: text("server_id")
      .notNull()
      .references(() => gameServers.id),
    fromVersion: uuid("from_version").references(() => ruleSetVersions.id),
    toVersion: uuid("to_version")
      .notNull()
      .references(() => ruleSetVersions.id),
    state: deploymentStateEnum("state").notNull(),
    candidatePod: text("candidate_pod"),
    snapshotId: text("snapshot_id"),
    playerVisibleMs: integer("player_visible_ms"),
    approvedBy: text("approved_by"),
    approvalTokenHash: text("approval_token_hash").references(() => approvalTokens.tokenHash),
    initiatedBy: text("initiated_by").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    error: text("error"),
  },
  (table) => [index("deployments_server_idx").on(table.serverId)],
);

export const worldEventsRollup = pgTable(
  "world_events_rollup",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: text("server_id")
      .notNull()
      .references(() => gameServers.id),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    metrics: jsonb("metrics").notNull().default(sql`'{}'::jsonb`),
  },
  (table) => [index("world_events_rollup_server_idx").on(table.serverId)],
);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: text("server_id")
      .notNull()
      .references(() => gameServers.id),
    suggestedRules: jsonb("suggested_rules").notNull(),
    rationale: text("rationale").notNull(),
    confidence: text("confidence").notNull(),
    status: proposalStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [index("proposals_server_idx").on(table.serverId)],
);

/**
 * Evaluation records are append-only observations, not a scoreboard. The random
 * baseline arm is stored explicitly so it cannot be lost in aggregation.
 *
 * Retention: keep records for two years. Pruning belongs to the existing
 * scheduler; the explicit deadline prevents an unbounded audit dataset.
 */
export const experiments = pgTable(
  "experiments",
  {
    experimentId: uuid("experiment_id").primaryKey().defaultRandom(),
    design: experimentDesignEnum("design").notNull(),
    arm: experimentArmEnum("arm").notNull(),
    serverId: text("server_id")
      .notNull()
      .references(() => gameServers.id),
    deploymentId: uuid("deployment_id")
      .notNull()
      .references(() => deployments.id),
    ruleVersion: integer("rule_version").notNull(),
    windowBeforeStart: timestamp("window_before_start", { withTimezone: true }).notNull(),
    windowBeforeEnd: timestamp("window_before_end", { withTimezone: true }).notNull(),
    windowAfterStart: timestamp("window_after_start", { withTimezone: true }).notNull(),
    windowAfterEnd: timestamp("window_after_end", { withTimezone: true }).notNull(),
    metricsBefore: jsonb("metrics_before").notNull(),
    metricsAfter: jsonb("metrics_after").notNull(),
    delta: jsonb("delta").notNull(),
    nPlayers: integer("n_players").notNull(),
    nSessions: integer("n_sessions").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    retainedUntil: timestamp("retained_until", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("experiments_server_created_idx").on(table.serverId, table.createdAt),
    uniqueIndex("experiments_deployment_arm_idx").on(table.deploymentId, table.arm),
  ],
);

export const machineTokens = pgTable(
  "machine_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("machine_tokens_user_idx").on(table.userId)],
);
