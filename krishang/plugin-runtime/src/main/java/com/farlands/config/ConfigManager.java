package com.farlands.config;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * How the runtime loads config ([CONFIRM]).
 *
 * PluginMain.saveDefaultConfig() copies config.yml out of the JAR into the plugin
 * data folder on first boot. JavaPlugin.getConfig() then prefers that external file.
 * Live control-plane changes still go through a new JAR + candidate server; this
 * class does not add a hot-reload path.
 *
 * Engineer 1's telemetry package may read getConfig() but must not edit this class.
 */
public final class ConfigManager {
    private ConfigManager() {}

    public static void ensureDefault(JavaPlugin plugin) {
        plugin.saveDefaultConfig();
        plugin.reloadConfig();
    }
}
