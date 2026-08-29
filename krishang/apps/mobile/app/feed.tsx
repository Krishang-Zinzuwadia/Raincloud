import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import EventSource from "react-native-sse";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export default function Feed() {
  const [lastId, setLastId] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const source = new EventSource(`${API}/v1/servers/server-1/events`, {
      headers: lastId ? { "Last-Event-ID": lastId } : {},
    });
    source.addEventListener("message", (event) => {
      if ("data" in event && event.data) {
        setLines((current) => [...current.slice(-20), String(event.data)]);
      }
      if ("lastEventId" in event && event.lastEventId) {
        setLastId(String(event.lastEventId));
      }
    });
    return () => source.close();
  }, [lastId]);

  return (
    <View style={{ padding: 16 }}>
      <Text>SSE with Last-Event-ID resume (react-native-sse).</Text>
      {lines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
    </View>
  );
}
