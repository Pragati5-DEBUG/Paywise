import { getCatalogProduct, lowestOfferPrice } from "@/lib/catalog";
import { listAlerts, saveAlertCheck } from "@/lib/deal-store";
import type { StoredAlert } from "@/lib/deal-types";
import { sendPriceDropEmail } from "@/lib/email";

let running = false;

function droppedSinceLastCheck(alert: StoredAlert, price: number) {
  return alert.lastPrice != null && price < alert.lastPrice;
}

/** Check every saved alert against the current lowest offer. */
export async function checkPriceAlerts() {
  if (running) return { busy: true as const, checked: 0, emailed: 0 };
  running = true;
  try {
    const alerts = await listAlerts();
    let checked = 0;
    let emailed = 0;
    for (const alert of alerts) {
      const { product } = await getCatalogProduct(alert.productId);
      const price = product ? lowestOfferPrice(product) : null;
      if (price == null) continue;
      checked += 1;
      const dropped = droppedSinceLastCheck(alert, price);
      let nextPrice = price;
      let notifiedPrice = alert.notifiedPrice ?? null;
      if (dropped && alert.email) {
        const result = await sendPriceDropEmail({
          to: alert.email,
          title: alert.title,
          previousPrice: alert.lastPrice ?? price,
          price,
          productId: alert.productId,
          currency: alert.currency,
        });
        if (result.ok) {
          notifiedPrice = price;
          emailed += 1;
        } else {
          nextPrice = alert.lastPrice ?? price;
          console.error(
            `[alerts] email failed for ${alert.productId}: ${result.error ?? "unknown"}`,
          );
        }
      }
      await saveAlertCheck(alert.id, {
        lastPrice: nextPrice,
        lastCheckedAt: new Date().toISOString(),
        notifiedPrice,
      });
    }
    return { busy: false as const, checked, emailed, alerts: alerts.length };
  } finally {
    running = false;
  }
}
