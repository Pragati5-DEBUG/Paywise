import { Channel3 } from "@channel3/sdk";

let client: Channel3 | null = null;

export function hasChannel3Key() {
  return Boolean(process.env.CHANNEL3_API_KEY?.trim());
}

export function getChannel3() {
  const apiKey = process.env.CHANNEL3_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CHANNEL3_API_KEY is missing. Add it to paypal/.env");
  }
  if (!client) {
    client = new Channel3({
      apiKey,
      country: "US",
      language: "en",
      currency: "USD",
    });
  }
  return client;
}
