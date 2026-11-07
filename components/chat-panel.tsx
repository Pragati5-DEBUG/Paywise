"use client";

import { FormEvent, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ask me to search products, or about alerts and purchases.",
    },
  ]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || data.error || "Sorry, I couldn't answer that.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Chat request failed. Try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-medium">Shopping agent</h2>
      <p className="mt-1 text-sm text-stone-500">
        Search products, check alerts, and purchase history.
      </p>
      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-stone-50 p-3 text-sm">
        {messages.map((msg, index) => (
          <p
            key={`${msg.role}-${index}`}
            className={
              msg.role === "user"
                ? "whitespace-pre-wrap font-medium text-stone-900"
                : "whitespace-pre-wrap text-stone-600"
            }
          >
            {msg.role === "user" ? "You: " : "Paywise: "}
            {msg.text}
          </p>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. sony headphones"
          className="h-10 flex-1 rounded-full border border-stone-200 px-4 text-sm outline-none focus:ring-2 focus:ring-stone-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-stone-900 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
