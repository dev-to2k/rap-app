"use client";

import { useState } from "react";
import { Alert, Button, Card, Field, Icon, Input, PageHeader, Select, Textarea } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

const REASON_VALUES = [
  "PAYMENT_ISSUE",
  "DOWNLOAD_FAILED",
  "EXCLUSIVE_CONFLICT",
  "WRONG_SKU",
  "OTHER",
] as const;

export default function SupportPage() {
  const t = useT();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState<(typeof REASON_VALUES)[number]>("PAYMENT_ISSUE");
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
    setResult(
      res.ok ? t("support.ticket", { id: data.ticketId, message: data.message }) : data.error || "Error",
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <PageHeader title={t("support.title")} description={t("support.description")} icon="support" />
      <form onSubmit={submit}>
        <Card className="space-y-4 p-6">
          <Field label={t("support.orderId")} hint="ORDER_ID">
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t("support.orderPlaceholder")}
              required
            />
          </Field>
          <Field label={t("support.reason")}>
            <Select
              name="reason_code"
              value={reason}
              required
              placeholder={t("common.selectPlaceholder")}
              onChange={(e) => setReason(e.target.value as (typeof REASON_VALUES)[number])}
            >
              {REASON_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`support.reasons.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("support.message")}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={t("support.messagePlaceholder")}
            />
          </Field>
          <Button type="submit" className="w-full">
            <>
              <Icon name="ticket" size="sm" />
              {t("support.submit")}
            </>
          </Button>
          {result ? <Alert variant={ok ? "success" : "danger"}>{result}</Alert> : null}
        </Card>
      </form>
    </div>
  );
}
