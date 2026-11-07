import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function usd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function historyStats(history: number[]) {
  if (!history.length) {
    return { min: 0, max: 0, avg: 0, current: 0 };
  }
  const min = Math.min(...history);
  const max = Math.max(...history);
  const avg = history.reduce((s, n) => s + n, 0) / history.length;
  const current = history[history.length - 1]!;
  return { min, max, avg, current };
}
