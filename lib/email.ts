type SendAlertEmailInput = {
  to: string;
  title: string;
  productId: string;
  currency?: string;
  currentPrice?: number | null;
};

export async function sendAlertConfirmationEmail(input: SendAlertEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
  if (!apiKey) {
    return { ok: false as const, skipped: true as const, error: "RESEND_API_KEY missing" };
  }

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const productUrl = `${origin}/product/${encodeURIComponent(input.productId)}`;
  const amount =
    input.currentPrice != null && input.currentPrice > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: input.currency || "USD",
        }).format(input.currentPrice)
      : null;
  const watchLine = amount
    ? `We check it once a day and email you whenever it drops below <strong>${amount}</strong>.`
    : "We check it once a day and email you whenever the price drops.";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Paywise <${from}>`,
      to: [input.to],
      subject: `Alert set: ${input.title}`,
      html: `
        <p>Your Paywise price alert is saved.</p>
        <p><strong>${input.title}</strong></p>
        <p>${watchLine} Buying the product removes the alert.</p>
        <p><a href="${productUrl}">Open product</a> · <a href="${origin}/watchlist">Watchlist & calendar</a></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false as const, skipped: false as const, error: detail.slice(0, 240) };
  }
  return { ok: true as const, skipped: false as const };
}

export async function sendPriceDropEmail(
  input: SendAlertEmailInput & { price: number; previousPrice: number },
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
  if (!apiKey) {
    return { ok: false as const, skipped: true as const, error: "RESEND_API_KEY missing" };
  }

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const productUrl = `${origin}/product/${encodeURIComponent(input.productId)}`;
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: input.currency || "USD",
    }).format(value);
  const price = money(input.price);
  const previous = money(input.previousPrice);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Paywise <${from}>`,
      to: [input.to],
      subject: `Price drop: ${input.title} is ${price}`,
      html: `
        <p><strong>${input.title}</strong> dropped from ${previous} to <strong>${price}</strong>.</p>
        <p><a href="${productUrl}">Open product</a></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false as const, skipped: false as const, error: detail.slice(0, 240) };
  }
  return { ok: true as const, skipped: false as const };
}
