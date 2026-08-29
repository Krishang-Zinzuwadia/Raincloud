import type { PluginBuilderBody } from "./types";

export type FormRule = {
  type: string;
  event?: string;
  message?: string;
  broadcastMessage?: string;
  starterKitItems?: { material: string; amount: number }[];
  potionEffect?: string;
  duration?: number;
  amplifier?: number;
  actionType?: string;
};

export function buildJson(
  pluginName: string,
  minecraftVersion: string,
  rules: FormRule[]
): PluginBuilderBody {
  const onPlayerJoin: NonNullable<PluginBuilderBody["onPlayerJoin"]> = {
    privateMessage: "",
    broadcastMessage: "",
    startingItems: [],
    potionEffects: [],
  };
  const onPlayerQuit: NonNullable<PluginBuilderBody["onPlayerQuit"]> = {
    broadcastMessage: "",
  };
  const onPlayerAction: NonNullable<PluginBuilderBody["onPlayerAction"]> = {
    triggerAction: "",
    achievement: {
      title: "",
      description: "",
      soundEffect: "",
    },
  };
  const out: PluginBuilderBody = {
    metadata: {
      pluginName: pluginName || "MyPlugin",
      minecraftVersion,
    },
    onPlayerJoin,
    onPlayerQuit,
    onPlayerAction,
  };

  for (const rule of rules) {
    switch (rule.type) {
      case "welcome_message":
        onPlayerJoin.privateMessage = rule.message;
        break;
      case "broadcast_announcement":
        if (rule.event === "player_quit") {
          onPlayerQuit.broadcastMessage = rule.broadcastMessage;
        } else if (rule.event === "player_join") {
          onPlayerJoin.broadcastMessage = rule.broadcastMessage;
        }
        break;
      case "starter_kit":
        onPlayerJoin.startingItems = rule.starterKitItems;
        break;
      case "potion_effect":
        onPlayerJoin.potionEffects = [
          {
            type: rule.potionEffect ?? "SPEED",
            durationTicks: (rule.duration ?? 0) * 20,
            amplifier: rule.amplifier ?? 0,
          },
        ];
        break;
      case "player_action":
        onPlayerAction.triggerAction = rule.actionType;
        break;
    }
  }

  return out;
}
