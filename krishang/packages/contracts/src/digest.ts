import { createHash } from "node:crypto";
import canonicalize from "canonicalize";

/** RFC 8785 JCS. Both E3 buildRuleJar and E2 building-state compare this. */
export function canonicalizeJson(value: unknown): string {
  const encoded = canonicalize(value);
  if (encoded === undefined) {
    throw new Error("cannot canonicalize value");
  }
  return encoded;
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function contentDigest(ruleJson: unknown, jarBytes: Uint8Array): string {
  const ruleHash = sha256Hex(canonicalizeJson(ruleJson));
  const jarHash = sha256Hex(jarBytes);
  return `sha256:${sha256Hex(`${ruleHash}:${jarHash}`)}`;
}

export function hashToken(token: string): string {
  return sha256Hex(token);
}
