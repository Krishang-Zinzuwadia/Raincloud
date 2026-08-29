# [CONFIRM] findings — Engineer 3

Baseline: `ACM-VIT/farlands` @ `main` (opened 2026-08-29). These files were read
before locking `packages/contracts` and exposing `buildRuleJar()`.

## `farlands-app/src/lib/plugin-builder/types.ts`

The v1 rule vocabulary is **join / quit / action config**, not spawn-rate or loot-table
primitives. A rule document is `PluginBuilderBody`:

- `metadata.pluginName`, `metadata.minecraftVersion`
- `onPlayerJoin`: private/broadcast messages, starting items, potion effects
- `onPlayerQuit`: broadcast message
- `onPlayerAction`: trigger action + achievement title/description/sound

This **is** the agent action space until a reviewed vocabulary expansion. The review-screen
example in ENGINEER-3.md (`hostile spawns near spawn: 0.5x -> 1.4x`) is not expressible in
the current schema; the semantic renderer walks this vocabulary instead.

## `validation.ts` (STACK open item 2)

Hand-rolled field checks, not Zod and not TypeBox. `packages/contracts` therefore
references the rule document as `Type.Unknown()` and leaves semantics to this file.
A reviewed statelessness check was added (rejects `counters` / similar) without
porting the validator.

## `farlands-app/src/lib/plugin-builder/jar-builder.ts`

Injection is a **resource rewrite**, not a class rewrite:

1. Load the template JAR.
2. Delete `config.yml` and `plugin.yml`.
3. Add new `config.yml` (YAML generated from the rule JSON) and a rewritten `plugin.yml`.

Rebuild cost is zip copy + two file replacements — cheap enough to sit inside every
deployment `building` state. No Java compilation at deploy time.

## `plugin-runtime` `config/`

`ConfigManager.java` is an **empty file** in the baseline. `PluginMain` calls
`saveDefaultConfig()` then listeners read `plugin.getConfig()`.

Bukkit semantics: `saveDefaultConfig()` copies `config.yml` from the JAR into the plugin
data folder on first boot; `getConfig()` thereafter prefers the **external data-folder
file**. So:

- A fresh JAR always carries the injected payload (needed for candidate pod B).
- After first start, an operator *could* edit the data-folder file without a rebuild.
- Live rule changes for Farlands Live still go through a new JAR + candidate server,
  because in-JVM reload is unsafe. External-path edits are not a supported control-plane
  path.

**E2 freeze budget:** `buildRuleJar()` is a zip rewrite, not a Maven build. Template JAR
fetch (blob) dominates if uncached; after cache it is milliseconds.

## Paper pin

Baseline `pom.xml` is **Paper 1.20.4-R0.1-SNAPSHOT**, Java 21, `api-version: 1.20`.
CONTEXT.md wants Paper 26.x / Java 25. That bump is a deliberate migration, not part of
this lift. Interpreter is copied as-is.

## `plugin-runtime` package boundary (E1)

Engineer 1 owns `src/main/java/com/farlands/telemetry/` only. Interpreter classes
(`PluginMain`, `listeners/*`, `models/*`, `config/*`) are Engineer 3. The telemetry
emitter may **read** `getConfig()` and hook the same Bukkit events; it must not edit
listener files. A package skeleton is in place.

## Backup `service.ts` (E2's [CONFIRM], recorded for freeze economics)

Not owned here. Opened enough to note: world copy is E2; our JAR rewrite does not need
volume attachment.
