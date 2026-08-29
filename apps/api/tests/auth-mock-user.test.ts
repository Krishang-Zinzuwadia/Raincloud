import { describe, expect, test } from "bun:test";

import { localMockUserId } from "../src/modules/auth/mock-user";

describe("localMockUserId", () => {
  test("allows an explicit local operator during development", () => {
    expect(localMockUserId("development", " owner-1 ")).toBe("owner-1");
    expect(localMockUserId("test", "owner-2")).toBe("owner-2");
  });

  test("does not create a bypass without a configured user", () => {
    expect(localMockUserId("development", undefined)).toBeNull();
    expect(localMockUserId("development", "  ")).toBeNull();
  });

  test("never enables the bypass in production", () => {
    expect(localMockUserId("production", "owner-1")).toBeNull();
  });
});
