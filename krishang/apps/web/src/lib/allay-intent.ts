export type AllayPowerAction = "start" | "stop" | "restart";

export type AllayIntent =
  | { kind: "greeting" }
  | { kind: "help" }
  | { kind: "list" }
  | { kind: "status" }
  | { kind: "copy" }
  | { kind: "power"; action: AllayPowerAction }
  | { kind: "unknown" };

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(input: string, phrases: string[]) {
  return phrases.some((phrase) =>
    new RegExp(`\\b${escapeRegExp(phrase).replaceAll(" ", "\\s+")}\\b`, "i").test(input),
  );
}

export function parseAllayIntent(value: string): AllayIntent {
  const input = normalize(value);

  if (!input) return { kind: "unknown" };

  if (containsPhrase(input, ["restart", "reboot", "cycle", "re launch", "relaunch"])) {
    return { kind: "power", action: "restart" };
  }

  if (
    containsPhrase(input, [
      "stop",
      "sleep",
      "shut down",
      "shutdown",
      "turn off",
      "power off",
      "take offline",
    ])
  ) {
    return { kind: "power", action: "stop" };
  }

  if (
    containsPhrase(input, [
      "start",
      "wake",
      "boot",
      "spin up",
      "turn on",
      "power on",
      "bring online",
    ])
  ) {
    return { kind: "power", action: "start" };
  }

  if (
    containsPhrase(input, ["copy", "address", "join code", "hostname", "ip", "endpoint"])
  ) {
    return { kind: "copy" };
  }

  if (
    containsPhrase(input, ["status", "state", "health", "online", "offline", "running", "how is"])
  ) {
    return { kind: "status" };
  }

  if (
    containsPhrase(input, [
      "list",
      "show realms",
      "show servers",
      "my realms",
      "my servers",
      "my workloads",
    ])
  ) {
    return { kind: "list" };
  }

  if (containsPhrase(input, ["help", "commands", "what can you do", "options"])) {
    return { kind: "help" };
  }

  if (containsPhrase(input, ["hi", "hello", "hey", "allay", "thanks", "thank you"])) {
    return { kind: "greeting" };
  }

  return { kind: "unknown" };
}
