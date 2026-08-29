export type AllayPowerAction = "start" | "stop" | "restart";

export type AllayCreateTemplate = "minecraft_paper" | "minecraft_vanilla";

export type CreateMinecraftBody = {
  name: string;
  game: "minecraft";
  type: "paper" | "vanilla";
  version: string;
  cpuCores: number;
  ramMb: number;
  storageGb: number;
  gameConfigJson: {
    maxPlayers: number;
    difficulty: "normal";
    pvp: boolean;
  };
};

export type AllayCreateIntent = {
  kind: "create";
  template: AllayCreateTemplate;
  body: CreateMinecraftBody;
};

export type AllayIntent =
  | { kind: "greeting" }
  | { kind: "help" }
  | { kind: "list" }
  | { kind: "status" }
  | { kind: "copy" }
  | { kind: "power"; action: AllayPowerAction }
  | AllayCreateIntent
  | { kind: "unknown" };

type CreateTemplateDefinition = {
  id: AllayCreateTemplate;
  label: string;
  aliases: string[];
  defaultName: string;
  body: Omit<CreateMinecraftBody, "name">;
};

const MINECRAFT_CONFIG = {
  maxPlayers: 20,
  difficulty: "normal" as const,
  pvp: true,
};

const CREATE_TEMPLATES: CreateTemplateDefinition[] = [
  {
    id: "minecraft_vanilla",
    label: "Minecraft Vanilla",
    aliases: ["minecraft vanilla", "vanilla minecraft", "vanilla server", "vanilla realm"],
    defaultName: "Vanilla Realm",
    body: {
      game: "minecraft",
      type: "vanilla",
      version: "1.21.8",
      cpuCores: 1,
      ramMb: 2048,
      storageGb: 5,
      gameConfigJson: MINECRAFT_CONFIG,
    },
  },
  {
    id: "minecraft_paper",
    label: "Minecraft Paper",
    aliases: [
      "minecraft paper",
      "paper minecraft",
      "paper server",
      "paper realm",
      "minecraft server",
      "minecraft realm",
      "minecraft",
    ],
    defaultName: "Minecraft Realm",
    body: {
      game: "minecraft",
      type: "paper",
      version: "1.21.8",
      cpuCores: 1,
      ramMb: 2048,
      storageGb: 5,
      gameConfigJson: MINECRAFT_CONFIG,
    },
  },
];

const CREATE_PHRASES = ["create", "make", "provision", "host", "set up", "spin up", "launch", "new"];

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

function createName(value: string, fallback: string): string {
  const match = value.match(/\b(?:named|called|name\s+it)\s+["'“”]?(.+?)["'“”]?\s*[.!?]*$/i);
  const requested = match?.[1]
    ?.replace(/\s+(?:please|for me)$/i, "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
  return (requested || fallback).replace(/\s+/g, " ").slice(0, 50);
}

function parseCreateIntent(value: string, input: string): AllayCreateIntent | null {
  if (!containsPhrase(input, CREATE_PHRASES)) return null;

  const template = CREATE_TEMPLATES.find((candidate) => containsPhrase(input, candidate.aliases));
  if (!template) return null;

  return {
    kind: "create",
    template: template.id,
    body: {
      name: createName(value, template.defaultName),
      ...template.body,
    },
  };
}

export function createTemplateLabel(template: AllayCreateTemplate): string {
  return CREATE_TEMPLATES.find((candidate) => candidate.id === template)?.label ?? "Minecraft realm";
}

export function parseAllayIntent(value: string): AllayIntent {
  const input = normalize(value);

  if (!input) return { kind: "unknown" };

  const createIntent = parseCreateIntent(value, input);
  if (createIntent) return createIntent;

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
