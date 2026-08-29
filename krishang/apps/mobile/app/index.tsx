import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export default function Proposals() {
  const { data } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const res = await fetch(`${API}/v1/servers/server-1/proposals`);
      return res.json();
    },
  });
  const approve = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/v1/proposals/${id}/approve`, {
        method: "POST",
        headers: { "x-principal": "user:owner-1" },
      }),
  });

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>Read-plus-approve. No authoring on this phone.</Text>
      {(data?.data ?? []).map((p: { id: string; rationale: string; confidence: number }) => (
        <View key={p.id} style={{ padding: 12, backgroundColor: "#eee" }}>
          <Text>{p.rationale}</Text>
          <Text>confidence {p.confidence}</Text>
          <Pressable onPress={() => approve.mutate(p.id)}>
            <Text>Approve</Text>
          </Pressable>
        </View>
      ))}
      <Link href="/rollback">Rollback</Link>
      <Link href="/servers">Servers</Link>
      <Link href="/feed">World feed</Link>
    </View>
  );
}
