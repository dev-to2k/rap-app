"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Radio } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

const KEY = "rap_payout_method";

type Method = "momo" | "bank";

export function PayoutSettings() {
  const t = useT();
  const [method, setMethod] = useState<Method>("momo");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem(KEY, JSON.stringify({ method, phone, bank, account, holder }));
    setSaved(true);
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("studio.payoutMethod")}</h2>
      <div className="flex flex-col gap-2">
        <Radio name="payout" value="momo" checked={method === "momo"} onChange={() => setMethod("momo")}>
          {t("studio.payoutMomo")}
        </Radio>
        <Radio name="payout" value="bank" checked={method === "bank"} onChange={() => setMethod("bank")}>
          {t("studio.payoutBank")}
        </Radio>
      </div>
      {method === "momo" ? (
        <Field label={t("studio.payoutPhone")}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("studio.payoutBankName")}>
            <Input value={bank} onChange={(e) => setBank(e.target.value)} />
          </Field>
          <Field label={t("studio.payoutAccount")}>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("studio.payoutHolder")}>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} />
            </Field>
          </div>
        </div>
      )}
      <Button size="sm" onClick={save}>
        {t("studio.savePayout")}
      </Button>
      {saved ? <p className="text-xs text-accent">{t("studio.savePayout")}</p> : null}
    </Card>
  );
}
