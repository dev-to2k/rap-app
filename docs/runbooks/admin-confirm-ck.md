# Runbook: Admin confirm CK unlock (prod)

One-command curls to list pending MoMo CK orders and confirm unlock on production.

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

```bash
ORDER_ID='clxxxxxxxx'   # from list response .orders[].id

curl -sS -X POST \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  "$BASE/api/admin/orders/${ORDER_ID}/confirm" | jq .
```

Success shape (approx): `{ "ok": true, "idempotent": false, "order": { ... }, "license": { ... } }`.  
Already unlocked → `{ "ok": true, "idempotent": true, ... }` (safe to retry).

## UI

After deploy of this branch: open `$BASE/admin` while logged in as admin — list + one-click **Xác nhận & mở khóa**.

## Notes

| | |
|---|---|
| **Role** | Non-admin → `403 Forbidden` |
| **Statuses accepted by confirm** | `pending_confirm`, `pending_ck`, `awaiting_payment`, `pending`, `paid` (heal); `unlocked` → idempotent OK |
| **Idempotent** | Same order confirm twice is OK |
| **Mock pay** | Off on prod (`ALLOW_PAYMENT_MOCKS` unset / mock routes 404) — do **not** use `/api/pay/mock` |
| **Secrets** | Never put real `COOKIE=` in git, screenshots, or PR bodies — placeholder only |

## Quick one-liner (list + confirm first pending_confirm)

```bash
export BASE=https://rap-app-five.vercel.app
export COOKIE='rap_session=...'
ORDER_ID=$(curl -sS -H "Cookie: $COOKIE" "$BASE/api/admin/orders?status=pending_confirm" \
  | jq -r '.orders[0].id // empty')
[ -n "$ORDER_ID" ] && curl -sS -X POST -H "Cookie: $COOKIE" \
  "$BASE/api/admin/orders/${ORDER_ID}/confirm" | jq . \
  || echo "No pending_confirm orders"
```
