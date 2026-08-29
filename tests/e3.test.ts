import { describe, expect, test } from "bun:test";
import { contentDigest } from "@repo/contracts";
import { sampleRuleJsonV1 } from "@repo/contracts/fixtures";
import { buildRuleJar, validatePluginBuilderBody } from "@repo/plugin-builder";
import { app } from "../apps/api/src/index.ts";
import { store } from "../apps/api/src/store.ts";

describe("plugin-builder", () => {
  test("rejects stateful counters", () => {
    const result = validatePluginBuilderBody({
      ...sampleRuleJsonV1,
      counters: { kills: 1 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("stateless");
  });

  test("buildRuleJar digest changes when one byte of JSON changes", async () => {
    const a = await buildRuleJar(sampleRuleJsonV1);
    const b = await buildRuleJar({
      ...sampleRuleJsonV1,
      onPlayerJoin: {
        ...sampleRuleJsonV1.onPlayerJoin,
        privateMessage: "Welcome to the world!",
      },
    });
    expect(a.contentDigest).not.toBe(b.contentDigest);
    expect(a.contentDigest.startsWith("sha256:")).toBe(true);
  });

  test("JCS digest is stable across key order", () => {
    const jar = new Uint8Array([1, 2, 3]);
    const left = contentDigest({ b: 1, a: 2 }, jar);
    const right = contentDigest({ a: 2, b: 1 }, jar);
    expect(left).toBe(right);
  });
});

describe("approvals", () => {
  test("machine token cannot mint", async () => {
    const res = await app.handle(
      new Request("http://local/v1/approvals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer flk_cli-1",
        },
        body: JSON.stringify({
          serverId: "server-1",
          ruleSetVersion: "00000000-0000-4000-8000-0000000000a2",
          contentDigest:
            "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          issuedTo: "flk_cli-1",
        }),
      })
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("approval_human_only");
  });

  test("human mints, second redeem fails, wrong principal fails", async () => {
    const mint = await app.handle(
      new Request("http://local/v1/approvals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-principal": "user:owner-1",
        },
        body: JSON.stringify({
          serverId: "server-1",
          ruleSetVersion: "00000000-0000-4000-8000-0000000000a2",
          contentDigest:
            "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          issuedTo: "flk_cli-1",
        }),
      })
    );
    expect(mint.status).toBe(200);
    const minted = (await mint.json()) as { token: string };
    const first = store.redeem(
      minted.token,
      "flk_cli-1",
      "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    );
    expect(first.ok).toBe(true);
    const second = store.redeem(
      minted.token,
      "flk_cli-1",
      "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    );
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.refusal.code).toBe("approval_consumed");

    const minted2 = store.mint({
      serverId: "server-1",
      ruleSetVersion: "00000000-0000-4000-8000-0000000000a2",
      contentDigest:
        "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      issuedTo: "flk_cli-1",
      issuedBy: "user:owner-1",
    });
    const wrong = store.redeem(
      minted2.token,
      "flk_other",
      "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    );
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.refusal.code).toBe("approval_principal_mismatch");
  });

  test("digest mismatch is refused", () => {
    const minted = store.mint({
      serverId: "server-1",
      ruleSetVersion: "00000000-0000-4000-8000-0000000000a2",
      contentDigest:
        "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      issuedTo: "flk_cli-1",
      issuedBy: "user:owner-1",
    });
    const result = store.redeem(minted.token, "flk_cli-1", "sha256:deadbeef");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.code).toBe("approval_digest_mismatch");
  });
});
