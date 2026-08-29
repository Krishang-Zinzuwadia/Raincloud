import { describe, expect, test } from "bun:test";

import { parseAllayIntent } from "./allay-intent";

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
});
