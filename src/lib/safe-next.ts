export function safeNextPath(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : undefined;
}
