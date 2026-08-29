CREATE TYPE "experiment_design" AS ENUM ('pre_post', 'parallel');
--> statement-breakpoint
CREATE TYPE "experiment_arm" AS ENUM ('director', 'human', 'random_baseline');
--> statement-breakpoint
CREATE TABLE "experiments" (
  "experiment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "design" "experiment_design" NOT NULL,
  "arm" "experiment_arm" NOT NULL,
  "server_id" text NOT NULL,
  "deployment_id" uuid NOT NULL,
  "rule_version" integer NOT NULL,
  "window_before_start" timestamp with time zone NOT NULL,
  "window_before_end" timestamp with time zone NOT NULL,
  "window_after_start" timestamp with time zone NOT NULL,
  "window_after_end" timestamp with time zone NOT NULL,
  "metrics_before" jsonb NOT NULL,
  "metrics_after" jsonb NOT NULL,
  "delta" jsonb NOT NULL,
  "n_players" integer NOT NULL,
  "n_sessions" integer NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "retained_until" timestamp with time zone NOT NULL,
  CONSTRAINT "experiments_n_players_nonnegative" CHECK ("n_players" >= 0),
  CONSTRAINT "experiments_n_sessions_nonnegative" CHECK ("n_sessions" >= 0),
  CONSTRAINT "experiments_window_before_valid" CHECK ("window_before_start" < "window_before_end"),
  CONSTRAINT "experiments_window_after_valid" CHECK ("window_after_start" < "window_after_end")
);
--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "game_servers"("id");
--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_deployment_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id");
--> statement-breakpoint
CREATE INDEX "experiments_server_created_idx" ON "experiments" ("server_id", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "experiments_deployment_arm_idx" ON "experiments" ("deployment_id", "arm");
