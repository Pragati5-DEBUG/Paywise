const DAY_MS = 24 * 60 * 60 * 1000;
const START_DELAY_MS = 20_000;

/** Run the price check once shortly after the server starts, then once a day. */
export function startAlertChecker() {
  const g = globalThis as typeof globalThis & {
    __dealpilotAlertsStarted?: boolean;
  };
  if (g.__dealpilotAlertsStarted) return;
  g.__dealpilotAlertsStarted = true;

  const run = () => {
    void import("@/lib/alert-check")
      .then((mod) => mod.checkPriceAlerts())
      .catch((error) => {
        console.error("[alerts] daily check failed", error);
      });
  };

  setTimeout(run, START_DELAY_MS);
  setInterval(run, DAY_MS);
}
