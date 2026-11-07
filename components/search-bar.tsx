"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  large = false,
  initialQuery = "",
}: {
  large?: boolean;
  initialQuery?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  async function onImage(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = btoa(binary);
      const res = await fetch("/api/search/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        token?: string;
      };
      if (!res.ok || !data.ok || !data.token) {
        setError(data.error || "Image search failed");
        return;
      }
      router.push(`/search?token=${encodeURIComponent(data.token)}`);
    } catch {
      setError("Could not read that image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-stone-200 bg-white shadow-sm ${
          large ? "p-2 pl-5" : "p-1.5 pl-4"
        }`}
      >
        <input
          aria-label="Search products, paste a URL, or upload an image"
          className={`w-full bg-transparent text-stone-900 outline-none placeholder:text-stone-400 ${
            large ? "text-base sm:text-lg" : "text-sm"
          }`}
          placeholder="Search, paste a product URL, or upload a photo"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onImage(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          disabled={uploading}
        >
          {uploading ? "…" : "Photo"}
        </button>
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-stone-900 font-medium text-white hover:bg-stone-800 ${
            large ? "px-5 py-3 text-sm" : "px-4 py-2 text-sm"
          }`}
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Search US stores by name, link, or photo
      </p>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
