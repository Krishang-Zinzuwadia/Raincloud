export function localMockUserId(
  environment: string | undefined,
  configuredUserId: string | undefined,
): string | null {
  if (environment === "production") return null;
  return configuredUserId?.trim() || null;
}
