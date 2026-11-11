const BASE_URL = "https://doodapi.co/api";

export function doodstreamApiKey(): string {
  const apiKey = process.env.DOODSTREAM_API_KEY;

  if (!apiKey) {
    throw new Error("DOODSTREAM_API_KEY is not set");
  }

  return apiKey;
}

export function doodstreamUrl(endpoint: string): string {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("key", doodstreamApiKey());

  return url.toString();
}
