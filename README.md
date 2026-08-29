# Farlands Live — Engineer 3 (krishang)

Platform core and human surfaces. **All implementation is in this folder.** Planning docs
live in `../Raincloud` (`ENGINEER-3.md`, `STACK.md`).

Stack choices from `STACK.md`: TypeScript strict, Bun workspaces + Turborepo, TypeBox
contracts, Drizzle/Postgres 16, Elysia mock API, Next.js + Tailwind + TanStack Query, Expo
+ `react-native-sse`, Biome, `bun test`, pino, RFC 8785 JCS digests, `apv_` / `flk_` tokens.

## What shipped

| Path | Role |
|---|---|
| `packages/contracts` | TypeBox v1 + fixtures + JCS digest helper |
| `packages/db` | Baseline through `0005` plus `0006` live tables + append-only trigger |
| `packages/plugin-builder` | Lifted pipeline + `buildRuleJar()` |
| `plugin-runtime/` | Lifted interpreter; Java 25 compiler; E1 owns `telemetry/` |
| `apps/api` | Mock v1 API (SSE replay, approvals, author stub) |
| `apps/web` | Review, progress, builder, proposals |
| `apps/mobile` | Expo: Proposals, Rollback, Servers, World feed |

## Run

```bash
bun install
bun test
bun run mock          # http://127.0.0.1:3001
bun run dev:web       # http://127.0.0.1:3000  (Node 22)
```

Human session: `x-principal: user:owner-1`.
Machine token: `Authorization: Bearer flk_cli-1` (`POST /v1/approvals` refuses it).

See `docs/CONFIRM.md` before changing the rule vocabulary or JAR injection.
