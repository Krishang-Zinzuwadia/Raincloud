# Raincloud

**Hi, this is our project (future product) Raincloud, a control surface for cloud coding agents.**

Workflow is simple, you point it at a repository, describe the work, and an agent runs in an isolated
cloud sandbox. You watch the run live, steer it mid flight, review the diff it
produced(always check the diffs :p), and open a PR from a browser or a phone, without keeping a
development machine awake.
In short, Raincloud is the new coding Environment that takes one step forward and leads us to an ero where coding is no longer done via static workstations but dynamic Mobile first environment. Everything on the go, so you never miss out on work.

> **Status:** early build. Currently we're just scaffolding everything and working towards the V1 version
> what the product is and how it is put together.

---

## Why

Coding agents are capable, but operating them is still awkward. They live in a
terminal on one machine, their state is invisible the moment you walk away, and
recovering a run that went sideways usually means starting over.

Raincloud treats an agent run as a first class, observable object:

- It runs **in the cloud**, not on your laptop.
- Its state is **legible** , queued, running, succeeded, failed, canceled  and
  its failures name the boundary that actually broke.
- It is **steerable** while it works, not just before it starts.
- It ends in something reviewable: a diff and a pull request.

## The loop

1. **Connect a repository.** GitHub auth, repo picker, branch selection.
2. **Start a session.** Choose the repo, the branch, and the model — a managed
   model or your own key.
3. **Watch it work.** A live event stream: assistant messages, tool calls, tool
   results, progress, and terminal state.
4. **Steer it.** Send guidance mid-run; the sandbox picks it up in-flight.
5. **Review.** Read the diff the session produced, file by file.
6. **Ship.** Open a pull request from the session.

## Surfaces

| Surface | What it is |
|---|---|
| **Web** | The primary dashboard, agents, sessions, live run view, diff review, settings, team. |
| **Mobile** | A full client at parity with web: start a session, follow the stream, steer, review, and approve from your phone. |

Both read the same API and the same entitlements, so a run started on one is
fully controllable from the other.

## Architecture

| Layer | Choice |
|---|---|
| **Control plane** | Node + Hono + TypeScript auth, session lifecycle, GitHub, billing, event ingest, SSE |
| **Sandbox** | Isolated per session cloud sandbox with a persistent workspace, behind a `SandboxProvider` seam |
| **Agent runtime** | Agent processes running inside the sandbox, normalizing their events into one streaming protocol |
| **Models** | Managed provider models by default; bring-your-own-key (Anthropic / OpenAI) as an alternative |
| **Web** | Next.js (App Router), React |
| **Mobile** | Expo / React Native, Expo Router, React Query |
| **Auth** | Cognito (email + GitHub federation, JWT) for identity; GitHub for repository access |
| **Database** | Postgres + Drizzle  control-plane state, lifecycle events, event index |
| **Object storage** | S3  transcripts (NDJSON), artifacts, workspace snapshots |
| **Realtime** | SSE with `Last-Event-ID` replay, so reconnects resume instead of restarting |
| **Secrets** | Managed secret store + KMS; user keys encrypted at rest, injected at invoke, never inlined |
| **Payments** | Behind a `BillingProvider` seam  subscription tiers, metered usage, hard spend ceilings |
| **Observability** | Structured logs, error tracking, metrics and alarms |
| **Infra** | Terraform, single primary region |

### Seams

Five interfaces exist so the pieces most likely to change can be swapped without
a rewrite:

- **`SandboxProvider`** :  where the agent executes
- **`AgentRuntime`** : which agent drives the work
- **`GitProvider`** : which forge holds the repository
- **`BillingProvider`** : which payment rail collects
- **`Store`** : how control-plane state is persisted

### Object model

```
Organization ──< Membership >── User
  └─ Project (1:1 repository)
     └─ Workspace (persistent sandbox reference + cloned repo + snapshot)
        └─ Session (one agent run) ── Event log · Diff · Pull request
```

### Event protocol

Everything the UI shows about a run comes from one typed, append-only event
stream shared by the runner, the sandbox, and both clients:

```
session_started · agent_message · user_message · tool_use · tool_result
progress · error · session_ended
```

One protocol, defined once in a shared contracts package, means the web and
mobile clients cannot drift from the backend.

## Repository layout

```
apps/
  web/         Next.js dashboard
  runner/      control plane — REST + SSE, session lifecycle, GitHub, billing
  mobile/      Expo client
packages/
  contracts/   shared types: API surface + agent event protocol (the locked seam)
  domain/      shared domain logic
sandbox/       agent runtime harness executed inside the sandbox
infra/         Terraform and provisioning
docs/          product, architecture, and operational docs
```

## Principles

- **Contracts first.** Types are agreed before implementations, and both clients
  import the same ones.
- **Honest state.** Never show a spinner where a real status exists; surface
  errors at the boundary that failed, not as generic failure.
- **Swap-without-rewrite.** Anything vendor-shaped sits behind an interface.
- **Secure by default.** Every authenticated route verifies a real token, keys
  never live in plaintext, and every run has a finite cost ceiling.
- **Parity, not a companion app.** Mobile is a full client, not a viewer.
- **Restraint.** Calm, concrete, legible. No decoration where information belongs.

## Development

**Prerequisites**

- Node 22+
- npm (workspaces)
- A GitHub account for repository access
- Cloud credentials for the sandbox, model, and database layers when running real
  sessions end to end

Setup and run commands land here as each workspace is stood up.

---

Raincloud, built for people who hand real repository work to agents and want to
see exactly what happened.
