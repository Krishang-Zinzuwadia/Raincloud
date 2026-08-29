import { describe, expect, test } from "bun:test";

import {
  type AllayCreateTemplate,
  classifyConfirmationReply,
  findMentionedServer,
  parseAllayIntent,
} from "./allay-intent";

describe("parseAllayIntent", () => {
  test("recognizes conversational power commands", () => {
    expect(parseAllayIntent("Could you spin up Survival for me?")).toEqual({
      kind: "power",
      action: "start",
    });
    expect(parseAllayIntent("put the realm to sleep")).toEqual({
      kind: "power",
      action: "stop",
    });
    expect(parseAllayIntent("reboot it please")).toEqual({
      kind: "power",
      action: "restart",
    });
  });

  test("keeps informational requests separate from mutations", () => {
    expect(parseAllayIntent("is Creative online?")).toEqual({ kind: "status" });
    expect(parseAllayIntent("copy the join address")).toEqual({ kind: "copy" });
    expect(parseAllayIntent("show my realms")).toEqual({ kind: "list" });
    expect(parseAllayIntent("what can you do?")).toEqual({ kind: "help" });
  });

  test("falls back safely for empty or unsupported requests", () => {
    expect(parseAllayIntent(" ")).toEqual({ kind: "unknown" });
    expect(parseAllayIntent("tell me a joke")).toEqual({ kind: "unknown" });
  });

  test("does not turn negated or informational language into mutations", () => {
    expect(parseAllayIntent("do not start Survival")).toEqual({ kind: "unknown" });
    expect(parseAllayIntent("never restart Creative")).toEqual({ kind: "unknown" });
    expect(parseAllayIntent("how do I start Survival?")).toEqual({ kind: "help" });
  });

  test.each([
    ["create a paper server named paper town", "minecraft_paper", "paper", "paper town"],
    [
      "make a vanilla minecraft realm called block party",
      "minecraft_vanilla",
      "vanilla",
      "block party",
    ],
  ])("maps %s to a safe template", (prompt, template, type, name) => {
    const intent = parseAllayIntent(prompt as string);
    expect(intent.kind).toBe("create");
    if (intent.kind !== "create") throw new Error("Expected a create intent");

    expect(intent.template).toBe(template as AllayCreateTemplate);
    expect(intent.body).toMatchObject({
      name,
      game: "minecraft",
      type,
      version: "1.21.8",
      cpuCores: 1,
      ramMb: 2048,
      storageGb: 5,
    });
  });
});

describe("findMentionedServer", () => {
  const servers = [
    { id: "one", name: "Survival" },
    { id: "two", name: "Survival Two" },
    { id: "three", name: "Creative" },
  ];

  test("prefers the longest explicit realm name", () => {
    expect(findMentionedServer(servers, "wake Survival Two")?.id).toBe("two");
  });

  test("supports numbered choices", () => {
    expect(findMentionedServer(servers, "server 3")?.id).toBe("three");
    expect(findMentionedServer(servers, "2")?.id).toBe("two");
    expect(findMentionedServer(servers, "wait 2 minutes")).toBeNull();
  });

  test("only uses conversation context for a pronoun", () => {
    expect(findMentionedServer(servers, "restart it", "three")?.id).toBe("three");
    expect(findMentionedServer(servers, "restart a server", "three")).toBeNull();
  });

  test("selects the only available realm without clarification", () => {
    expect(findMentionedServer([servers[0]], "wake my realm")?.id).toBe("one");
    expect(findMentionedServer([servers[0]], "wake Creative")).toBeNull();
  });
});

describe("classifyConfirmationReply", () => {
  test("only accepts an unambiguous whole reply", () => {
    expect(classifyConfirmationReply("yes")).toBe("confirm");
    expect(classifyConfirmationReply("go ahead")).toBe("confirm");
    expect(classifyConfirmationReply("yes, but don't stop it")).toBe("other");
    expect(classifyConfirmationReply("confirm status first")).toBe("other");
  });

  test("recognizes explicit cancellation", () => {
    expect(classifyConfirmationReply("cancel")).toBe("cancel");
    expect(classifyConfirmationReply("don't")).toBe("cancel");
  });
});
