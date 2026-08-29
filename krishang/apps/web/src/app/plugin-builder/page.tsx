"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function BuilderPage() {
  const [pluginName, setPluginName] = useState("SpawnWelcome");
  const [message, setMessage] = useState("Welcome to the world.");
  const [status, setStatus] = useState("");

  async function submit() {
    setStatus("Authoring…");
    const result = await api("/v1/servers/server-1/rule-sets/author", {
      method: "POST",
      body: JSON.stringify({
        prompt: `Plugin ${pluginName} with join message: ${message}`,
      }),
    });
    setStatus(JSON.stringify(result, null, 2));
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Plugin builder</h1>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Source = form. Does not deploy. Deployment always goes through review.
      </p>
      <label className="mb-3 block text-sm">
        Plugin name
        <input
          className="mt-1 w-full rounded bg-[var(--card)] p-2"
          value={pluginName}
          onChange={(e) => setPluginName(e.target.value)}
        />
      </label>
      <label className="mb-3 block text-sm">
        Join private message
        <input
          className="mt-1 w-full rounded bg-[var(--card)] p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <button className="rounded bg-white px-4 py-2 text-black" onClick={submit} type="button">
        Create version
      </button>
      <pre className="mt-4 overflow-auto text-xs">{status}</pre>
    </div>
  );
}
