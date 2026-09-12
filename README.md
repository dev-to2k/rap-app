# Rap App

Chợ beat **VN-first**: producer đăng beat → buyer mua license (3 SKU) → checkout VND → webhook xác nhận → PDF license + tải file.

Repo: [`dev-to2k/rap-app`](https://github.com/dev-to2k/rap-app)

> MVP demo — payment là **mock**. Chưa gắn MoMo/VNPay thật.

---

## Tính năng (MVP)

| | |
|---|---|
| **SKU** | Lease MP3 · WAV + stems · Exclusive |
| **Take-rate** | 15% GMV (seed có promo 12% / 90 ngày) |
| **Sample** | `clean` \| `uncleared` — uncleared **cấm Exclusive** |
| **Exclusive** | Atomic `sold_exclusive`, delist, lease cũ vẫn valid |
| **Unlock** | Chỉ sau webhook OK (signature + amount + order, idempotent) |
| **Auth** | Cookie session HMAC — role `buyer` \| `producer` |

### Màn hình

1. `/` — danh sách beat (search/empty CTA)
2. `/beats/[id]` — chi tiết + 3 SKU
3. `/upload` — đăng beat
4. `/checkout/[orderId]` — thanh toán mock (MoMo / VNPay / CK)
5. `/orders/[orderId]/success` · `/license/[id]` · `/library` — sau khi unlock
6. `/login` · `/support`

---

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind (mobile-first)
- **Prisma** + **SQLite** local (`file:./dev.db`) — prod đổi Postgres/Neon
- Storage local `storage/` — prod → R2/S3
- PDF license (`pdf-lib` / pdfkit) + signed download URL (HMAC, TTL ngắn)
- Health: `GET /api/health`

---

## Chạy local

Yêu cầu: [Bun](https://bun.sh) (hoặc Node 20+).

```bash
git clone https://github.com/dev-to2k/rap-app.git
cd rap-app
cp .env.example .env
bun install
bunx prisma db push
bun run db:seed
bun run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Scripts

| Lệnh | Việc |
|------|------|
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run start` | Chạy build |
| `bun run db:push` | Sync schema |
| `bun run db:seed` | Seed user + beat demo |
| `bun run db:reset` | Reset DB + seed lại |

### Biến môi trường

Copy từ `.env.example` (không commit `.env`):

| Key | Mục đích |
|-----|----------|
| `DATABASE_URL` | SQLite local / Postgres prod |
| `SESSION_SECRET` | HMAC cookie session (≥32 ký tự) |
| `DOWNLOAD_HMAC_SECRET` | Ký URL tải file |
| `WEBHOOK_SECRET` | Verify webhook stub |
| `NEXT_PUBLIC_APP_URL` | Base URL app |

Prod sẽ thêm: `R2_*`, `MOMO_*`, `VNPAY_*` (xem note Security/DevOps — chưa bắt buộc cho demo).

---

## Tài khoản demo

Sau `bun run db:seed` — mật khẩu tất cả: `password123`

| Email | Role |
|-------|------|
| `buyer@rap.app` | buyer |
| `producer@rap.app` | producer |
| `minhprod@rap.app` | producer |

### Flow demo (mock pay → license)

1. Login `buyer@rap.app`
2. Mở beat → chọn SKU → Mua
3. Checkout → chọn MoMo / VNPay / CK → **Pay (mock webhook)**
4. Webhook verify → unlock PDF + file
5. Vào Library / trang license để tải (URL có hạn)

Producer: login `producer@rap.app` → `/upload` đăng beat.

---

## Cấu trúc thư mục (chính)

```
prisma/           schema + seed
src/app/          pages + API routes
src/components/   UI (SKU, checkout, upload…)
src/lib/          auth, webhook, unlock, pdf, signed-url
storage/          audio/licenses local (gitignore)
.env.example      template secrets
```

### Security paths (ship-first)

- `src/lib/webhook.ts` — HMAC verify stub
- `src/app/api/webhooks/payment/route.ts` — signature · amount · order · idempotent
- `src/lib/unlock.ts` — license + exclusive atomic
- `src/lib/signed-url.ts` — download TTL ngắn
- Preview không leak WAV/stems trước pay

---

## Local → Production

| Demo local | Production |
|------------|------------|
| SQLite | Postgres / Neon |
| `storage/` disk | Cloudflare R2 / S3 + signed URL |
| Mock MoMo/VNPay/CK webhook | Gateway thật + IPN |
| Credentials login | Magic-link / OAuth (optional) |
| Vercel Preview / tunnel | Vercel + staging env tách |

Deploy tối giản (DevOps): **Vercel** (Next.js) · **Neon/Supabase** · **R2** · webhook trên cùng app.

---

## Trạng thái

- [x] Scaffold MVP + mock checkout trên `main`
- [ ] Waitlist `/waitlist` (schema `WaitlistSignup` đã có — page chưa)
- [ ] MoMo/VNPay sandbox thật
- [ ] Vercel Preview URL public

---

## License

Private — `dev-to2k/rap-app`. All rights reserved.
