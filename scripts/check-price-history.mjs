import fs from "fs";
import { Channel3 } from "@channel3/sdk";

const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const key = env
  .split(/\r?\n/)
  .find((l) => l.startsWith("CHANNEL3_API_KEY="))
  ?.slice("CHANNEL3_API_KEY=".length)
  .trim()
  .replace(/^["']|["']$/g, "");

if (!key) {
  console.log("NO_KEY");
  process.exit(1);
}

const client = new Channel3({
  apiKey: key,
  country: "US",
  language: "en",
  currency: "USD",
});

const search = await client.products.search({
  query: "wireless headphones",
  country: "US",
  language: "en",
  currency: "USD",
  page_size: 3,
});
const id = search.products?.[0]?.id || search.data?.[0]?.id;
console.log("PRODUCT_ID=" + id);
if (!id) process.exit(1);

try {
  await client.priceTracking.start({ canonical_product_id: id });
  console.log("TRACK_START=ok");
} catch (e) {
  console.log("TRACK_START=" + (e?.message || e).toString().slice(0, 120));
}

const hist = await client.priceTracking.retrieveHistory({
  canonical_product_id: id,
  days: 90,
});
const points = hist.history || [];
console.log("POINTS=" + points.length);
if (points[0]) {
  const t = points[0].timestamp;
  console.log("SAMPLE=" + JSON.stringify({
    timestamp: t instanceof Date ? t.toISOString() : t,
    price: points[0].price,
    currency: points[0].currency,
  }));
}
if (hist.statistics) {
  console.log("STATS=" + JSON.stringify({
    min: hist.statistics.min_price,
    max: hist.statistics.max_price,
    current: hist.statistics.current_price,
    status: hist.statistics.current_status,
  }));
}
