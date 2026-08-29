import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export default function Servers() {
  const { data } = useQuery({
    queryKey: ["servers"],
    queryFn: async () => (await fetch(`${API}/v1/servers`)).json(),
  });
  const server = data?.data?.[0];
  return (
    <View style={{ padding: 16 }}>
      <Text>{server?.name}</Text>
      <Text>{server?.address}</Text>
      <Text>
        {server?.playerCount} players · {server?.tps} TPS
      </Text>
    </View>
  );
}
