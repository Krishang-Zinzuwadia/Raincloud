import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

export default function Layout() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Proposals" }} />
        <Stack.Screen name="rollback" options={{ title: "Rollback" }} />
        <Stack.Screen name="servers" options={{ title: "Servers" }} />
        <Stack.Screen name="feed" options={{ title: "World feed" }} />
      </Stack>
    </QueryClientProvider>
  );
}
