# Runbook: payOS sandbox (dual-rail with MoMo CK)

Sandbox-only integration. **Do not** put prod `PAYOS_*` on Vercel until anh greenlights. Keep `ALLOW_PAYMENT_MOCKS` off on prod. MoMo CK rail stays until ≥3 auto unlocks.

## Env (names only)

```bash
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
# HOLD prod — sandbox keys from my.payos.vn only for preview/local smoke
```

Also keep dual-rail CK:

```bash
PAYMENT_MOMO_PHONE=
```

## Webhook URL

Register in payOS dashboard (Kênh thanh toán → Webhook):

```text
https://<host>/api/webhooks/payos
```

Examples:

- Local tunnel: `https://<ngrok>/api/webhooks/payos`
- Preview: `https://<preview>.vercel.app/api/webhooks/payos`

**Do not** merge into MoMo IPN at `/api/webhooks/payment`.

payOS will POST a signed body `{ code, desc, success, data, signature }`. We verify with `PAYOS_CHECKSUM_KEY`, map `data.orderCode` → order via `paymentRef` (`payos:{orderCode}:{paymentLinkId}`), then call `confirmPaymentAndUnlock`.

## Buyer flow

1. Checkout with `paymentMethod: "auto"` → `payos` when keys present, else `momo` CK.
2. Checkout page auto-calls `POST /api/orders/:id/payos` → payment link + optional QR.
3. Dual-rail: CK block (phone + nội dung = order id) stays on the same page.
4. Retry unpaid: `POST /api/orders/:id/payos` with `{ "retry": true }` — **same order**, new `orderCode` / `paymentRef`.
5. TTL **60 minutes** — ONLY unpaid payOS `awaiting_payment` expires on order GET and via `/api/cron/release-reserves`. **`pending_ck` (CK tay) does NOT expire** — waits admin confirm/cancel (CoS lock).

## Smoke checklist (needs sandbox keys from anh)

1. Set three `PAYOS_*` in local `.env.local` (never commit).
2. Confirm webhook URL in payOS UI.
3. Buy a lease → checkout shows payOS open-link + CK backup.
4. Pay in sandbox → webhook → order `unlocked`.
5. Replay webhook → 200 idempotent.
6. Bad signature → 401.
7. Unset keys → checkout still works via CK (no crash).

## Out of scope here

- Prod secrets / Vercel env
- MoMo Business Collection
- Auto disbursement / producer payout
