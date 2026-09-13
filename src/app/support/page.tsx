"use client";

import { useState } from "react";
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/kit";

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
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason_code: reason, message }),
    });
    const data = await res.json();
    setOk(res.ok);
    setResult(res.ok ? `Ticket ${data.ticketId}: ${data.message}` : data.error || "Error");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Support" description="Gửi ticket theo ORDER_ID — thanh toán, tải file, Exclusive, SKU." />
      <form onSubmit={submit}>
        <Card className="space-y-4 p-6">
          <Field label="ORDER_ID">
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
          </Field>
          <Field label="Lý do">
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nội dung">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </Field>
          <Button type="submit" className="w-full">
            Gửi ticket
          </Button>
          {result ? <Alert variant={ok ? "success" : "danger"}>{result}</Alert> : null}
        </Card>
      </form>
    </div>
  );
}
