import { Pressable, Text, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export default function Rollback() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>
        Rule rollback stops the rule acting further. It does not undo what already
        happened in the world.
      </Text>
      <Pressable
        onPress={() =>
          fetch(`${API}/v1/servers/server-1/rollback`, { method: "POST" })
        }
      >
        <Text>Roll back rules</Text>
      </Pressable>
      <Text>
        Snapshot restore discards play since the change and is not on this screen.
      </Text>
    </View>
  );
}
