# Runbook: Admin confirm CK unlock (prod)

One-command curls to list pending MoMo CK orders and confirm unlock on production.
Also documents the buyer «Tôi đã chuyển» path and post-unlock Library / PDF checks for operators.

## Prod base

```text
https://rap-app-five.vercel.app
```

(GitHub repo homepage + `.env.example`. Older alias `https://rap-app.vercel.app` is **not** deployed.)

## Auth

- Cookie name: `rap_session` (`SESSION_COOKIE` in `src/lib/auth.ts`)
- Role required: **admin** (`requireUser(["admin"])`)
- Session is httpOnly HMAC cookie — copy value from browser after admin login

### Get session cookie

1. Open prod → login as an **admin** user (`/login`).
2. DevTools → **Application** (Chrome) / **Storage** (Firefox) → Cookies → `https://rap-app-five.vercel.app`
3. Copy the value of `rap_session` (long `body.sig` string).
4. Export locally (do **not** commit or paste into chat/logs):

```bash
export BASE=https://rap-app-five.vercel.app
export COOKIE='rap_session=PASTE_VALUE_HERE'
```

## CK phone (ops verify)

- Display phone comes **only** from env `PAYMENT_MOMO_PHONE` (`src/lib/payment-phone.ts`) — never hardcoded in UI.
- **Expected prod value (ops check):** `0948868324`
- On checkout, buyer must see that phone + transfer content = **order id**. If phone blank → fix Vercel env, do not invent digits in docs/UI.

## Smoke / do-not-unlock

- **Do not** confirm/unlock designated smoke orders unless CoS explicitly says so.
- Known smoke (keep pending): `cmujmar050006x4dsu126g0fq` (`pending_ck`).
- Safe: list via UI/API. Unsafe without CoS: `POST .../confirm` on that id.

## Buyer path (guest vs logged-in)

There is **no** anonymous guest checkout and **no** claim-token API. Orders bind to `buyerId` at create.

| Buyer | Flow |
|---|---|
| **Logged-in** | Beat → `POST /api/checkout` → `/checkout/{orderId}` (`pending_ck` for momo/ck) → MoMo CK → **«Tôi đã chuyển»** → `POST /api/orders/{id}/transferred` → `pending_confirm` (**no unlock**) |
| **Guest** | Login hint on buy panel; CTA → 401 → `sessionStorage` pending buy → `/login?next=/checkout/resume` → after auth same as logged-in |

Status chain:

```text
pending_ck  --(buyer transferred)-->  pending_confirm  --(admin confirm)-->  paid → unlocked (+ license PDF)
```

`pending_ck` does **not** auto-expire (unlike payOS `awaiting_payment` TTL 60m).

## List pending CK orders

Default status is `pending_confirm`. Also list `pending_ck`, or use `all_pending` (OR of both).

```bash
# pending_confirm (buyer marked "đã chuyển")
curl -sS -H "Cookie: $COOKIE" \
  "$BASE/api/admin/orders?status=pending_confirm" | jq .

# pending_ck (awaiting transfer)
curl -sS -H "Cookie: $COOKIE" \
  "$BASE/api/admin/orders?status=pending_ck" | jq .

# both (prefer for ops)
curl -sS -H "Cookie: $COOKIE" \
  "$BASE/api/admin/orders?status=all_pending" | jq .
```

Without `jq`, drop `| jq .`.

## Confirm one order (unlock)

**Skip smoke ids** (see above). Confirm only real buyer transfers you have verified in MoMo.

```bash
ORDER_ID='clxxxxxxxx'   # from list response .orders[].id

curl -sS -X POST \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  "$BASE/api/admin/orders/${ORDER_ID}/confirm" | jq .
```

Success shape (approx): `{ "ok": true, "idempotent": false, "order": { ... }, "license": { ... } }`.  
Already unlocked → `{ "ok": true, "idempotent": true, ... }` (safe to retry).

Core: `confirmPaymentAndUnlock` → `unlockOrder` (license + PDF).

## Post-unlock: Library + PDF (buyer verify)

After confirm, ask buyer (or test account that owns the order) to check:

1. `/orders/{orderId}/success` — status unlocked, license id, download buttons.
2. `/library` — same license; downloads only when order `unlocked`.
3. **Tải PDF giấy phép** via signed link from `GET|POST /api/licenses/{licenseId}/download-links` (`fileKind: pdf`).
4. Order link for the buyer is `/checkout/{id}` (pre-pay) or `/orders/{id}/success` (post-unlock) — session-bound, not a public claim URL.

## UI

Open `$BASE/admin` while logged in as admin — list + one-click **Xác nhận & mở khóa**.

## Notes

| | |
|---|---|
| **Role** | Non-admin → `403 Forbidden` |
| **Statuses accepted by confirm** | `pending_confirm`, `pending_ck`, `awaiting_payment`, `pending`, `paid` (heal); `unlocked` → idempotent OK |
| **Idempotent** | Same order confirm twice is OK |
| **Mock pay** | Off on prod (`ALLOW_PAYMENT_MOCKS` unset / mock routes 404) — do **not** use `/api/pay/mock` |
| **Secrets** | Never put real `COOKIE=` in git, screenshots, or PR bodies — placeholder only |
| **Gate** | Docs-only edits: CI → QC → CoS |

## Quick one-liner (list + confirm first pending_confirm)

```bash
export BASE=https://rap-app-five.vercel.app
export COOKIE='rap_session=...'
ORDER_ID=$(curl -sS -H "Cookie: $COOKIE" "$BASE/api/admin/orders?status=pending_confirm" \
  | jq -r '.orders[0].id // empty')
# Refuse smoke
[ "$ORDER_ID" = "cmujmar050006x4dsu126g0fq" ] && { echo "SMOKE — do not unlock"; exit 1; }
[ -n "$ORDER_ID" ] && curl -sS -X POST -H "Cookie: $COOKIE" \
  "$BASE/api/admin/orders/${ORDER_ID}/confirm" | jq . \
  || echo "No pending_confirm orders"
```
