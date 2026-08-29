CREATE TYPE "rule_source" AS ENUM ('form', 'agent', 'director');
--> statement-breakpoint
CREATE TYPE "deployment_state" AS ENUM ('idle', 'building', 'staging', 'presync', 'freezing', 'verifying', 'cutover', 'draining', 'failed', 'aborted');
--> statement-breakpoint
CREATE TYPE "proposal_status" AS ENUM ('pending', 'approved', 'rejected');
--> statement-breakpoint
CREATE TABLE "rule_set_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_set_id" text NOT NULL,
  "version" integer NOT NULL,
  "json_url" text NOT NULL,
  "content_digest" text NOT NULL,
  "built_jar_url" text NOT NULL,
  "source" "rule_source" NOT NULL,
  "source_prompt" text,
  "created_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rule_set_versions_set_version_idx" ON "rule_set_versions" ("rule_set_id", "version");
--> statement-breakpoint
CREATE UNIQUE INDEX "rule_set_versions_json_url_idx" ON "rule_set_versions" ("json_url");
--> statement-breakpoint
ALTER TABLE "rule_set_versions" ADD CONSTRAINT "rule_set_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id");
--> statement-breakpoint
CREATE TABLE "approval_tokens" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "server_id" text NOT NULL,
  "rule_set_version" uuid NOT NULL,
  "content_digest" text NOT NULL,
  "issued_to" text NOT NULL,
  "issued_by" text NOT NULL,
  "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "approval_tokens" ADD CONSTRAINT "approval_tokens_server_id_game_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "game_servers"("id");
--> statement-breakpoint
ALTER TABLE "approval_tokens" ADD CONSTRAINT "approval_tokens_rule_set_version_fk" FOREIGN KEY ("rule_set_version") REFERENCES "rule_set_versions"("id");
--> statement-breakpoint
CREATE TABLE "deployments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "server_id" text NOT NULL,
  "from_version" uuid,
  "to_version" uuid NOT NULL,
  "state" "deployment_state" NOT NULL,
  "candidate_pod" text,
  "snapshot_id" text,
  "player_visible_ms" integer,
  "approved_by" text,
  "approval_token_hash" text,
  "initiated_by" text NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "error" text
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "game_servers"("id");
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_from_version_fk" FOREIGN KEY ("from_version") REFERENCES "rule_set_versions"("id");
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_to_version_fk" FOREIGN KEY ("to_version") REFERENCES "rule_set_versions"("id");
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_approval_token_hash_fk" FOREIGN KEY ("approval_token_hash") REFERENCES "approval_tokens"("token_hash");
--> statement-breakpoint
CREATE TABLE "world_events_rollup" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "server_id" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "window_end" timestamp with time zone NOT NULL,
  "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "world_events_rollup" ADD CONSTRAINT "world_events_rollup_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "game_servers"("id");
--> statement-breakpoint
CREATE TABLE "proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "server_id" text NOT NULL,
  "suggested_rules" jsonb NOT NULL,
  "rationale" text NOT NULL,
  "confidence" text NOT NULL,
  "status" "proposal_status" DEFAULT 'pending' NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamp with time zone,
  "rejection_reason" text
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "game_servers"("id");
--> statement-breakpoint
CREATE TABLE "machine_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "machine_tokens" ADD CONSTRAINT "machine_tokens_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION farlands_reject_rule_set_version_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'rule_set_versions is append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER rule_set_versions_append_only
  BEFORE UPDATE OR DELETE ON rule_set_versions
  FOR EACH ROW
  EXECUTE FUNCTION farlands_reject_rule_set_version_mutation();
