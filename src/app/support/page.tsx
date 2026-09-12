"use client";

import { useState } from "react";

const REASONS = [
  "PAYMENT_ISSUE",
  "DOWNLOAD_FAILED",
  "EXCLUSIVE_CONFLICT",
  "WRONG_SKU",
  "OTHER",
] as const;

export default function SupportPage() {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("PAYMENT_ISSUE");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason_code: reason, message }),
    });
    const data = await res.json();
    setResult(res.ok ? `Ticket ${data.ticketId}: ${data.message}` : data.error || "Error");
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Support</h1>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <label className="block text-sm">
          ORDER_ID
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          reason_code
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
            rows={3}
          />
        </label>
        <button type="submit" className="w-full rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500">
          Gửi ticket
        </button>
        {result && <p className="text-sm text-emerald-300">{result}</p>}
      </form>
    </div>
  );
}
