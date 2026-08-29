import type { PluginBuilderBody } from "./types";

function line(label: string, from: string, to: string): string | null {
  if (from === to) return null;
  return `${label}: ${from || "(empty)"} -> ${to || "(empty)"}`;
}

function items(items?: { material: string; amount: number }[]): string {
  return (items ?? []).map((i) => `${i.material} x${i.amount}`).join(", ");
}

function effects(
  effects?: { type: string; durationTicks: number; amplifier: number }[]
): string {
  return (effects ?? [])
    .map((effect) => `${effect.type} level ${effect.amplifier + 1} for ${effect.durationTicks} ticks`)
    .join(", ");
}

/** Vocabulary-aware sentences. Never a JSON patch. */
export function semanticDiff(from: PluginBuilderBody, to: PluginBuilderBody): string[] {
  const lines: (string | null)[] = [
    line(
      "join private message",
      from.onPlayerJoin?.privateMessage ?? "",
      to.onPlayerJoin?.privateMessage ?? ""
    ),
    line(
      "join broadcast",
      from.onPlayerJoin?.broadcastMessage ?? "",
      to.onPlayerJoin?.broadcastMessage ?? ""
    ),
    line("join starting items", items(from.onPlayerJoin?.startingItems), items(to.onPlayerJoin?.startingItems)),
    line(
      "join potion effects",
      effects(from.onPlayerJoin?.potionEffects),
      effects(to.onPlayerJoin?.potionEffects)
    ),
    line(
      "quit broadcast",
      from.onPlayerQuit?.broadcastMessage ?? "",
      to.onPlayerQuit?.broadcastMessage ?? ""
    ),
    line(
      "action trigger",
      from.onPlayerAction?.triggerAction ?? "",
      to.onPlayerAction?.triggerAction ?? ""
    ),
    line(
      "achievement title",
      from.onPlayerAction?.achievement?.title ?? "",
      to.onPlayerAction?.achievement?.title ?? ""
    ),
    line(
      "achievement description",
      from.onPlayerAction?.achievement?.description ?? "",
      to.onPlayerAction?.achievement?.description ?? ""
    ),
  ];
  return lines.filter((value): value is string => value !== null);
}
