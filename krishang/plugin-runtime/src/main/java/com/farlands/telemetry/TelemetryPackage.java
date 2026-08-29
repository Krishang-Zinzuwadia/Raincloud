package com.farlands.telemetry;

/**
 * Engineer 1 owns this package. Interpreter classes stay in listeners/, models/, config/.
 * Emitter should batch NDJSON, POST with java.net.http.HttpClient, fail silently.
 */
public final class TelemetryPackage {
    private TelemetryPackage() {}
}
