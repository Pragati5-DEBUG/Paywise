export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAlertChecker } = await import("@/lib/alert-scheduler");
    startAlertChecker();
  }
}
