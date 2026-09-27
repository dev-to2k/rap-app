import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { Badge, Card, Container, EmptyState, PageHeader, Price } from "@/kit";
import { getLocale, getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

const KNOWN_STATUSES = [
  "pending",
  "pending_ck",
  "awaiting_payment",
  "pending_confirm",
  "paid",
  "unlocked",
  "failed",
] as const;

function statusBadge(status: string): "accent" | "warning" | "danger" | "default" {
  if (status === "unlocked" || status === "paid") return "accent";
  if (status === "failed") return "danger";
  if (
    status === "pending_confirm" ||
    status === "pending_ck" ||
    status === "awaiting_payment" ||
    status === "pending"
  ) {
    return "warning";
  }
  return "default";
}

function statusLabelKey(status: string): string {
  return (KNOWN_STATUSES as readonly string[]).includes(status)
    ? `studio.orderStatus.${status}`
    : status;
}

function pipelineHintKey(status: string): string | null {
  if (status === "pending_ck") return "studio.pipelineCk";
  if (status === "pending_confirm") return "studio.pipelineConfirm";
  if (status === "unlocked") return "studio.pipelineUnlocked";
  return null;
}

function formatOrderDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function StudioOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio/orders");
  const t = getT();
  const locale = getLocale();

  type Row = {
    id: string;
    sku: string;
    status: string;
    gmvVnd: number;
    payableVnd: number;
    createdAt: Date;
    beatTitle: string;
  };

  let rows: Row[] = [];
  if (hasDatabaseUrl()) {
    try {
      const orders = await prisma.order.findMany({
        where: { beat: { producerId: user.id } },
        include: { beat: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      rows = orders.map((o) => ({
        id: o.id,
        sku: o.sku,
        status: o.status,
        gmvVnd: o.gmvVnd || o.amountVnd,
        payableVnd:
          o.payableVnd ||
          o.amountVnd - Math.round((o.amountVnd * o.takeRateBps) / 10_000),
        createdAt: o.createdAt,
        beatTitle: o.beat.title,
      }));
    } catch {
      rows = [];
    }
  }

  return (
    <Container className="py-8">
      <PageHeader
        title={t("studio.orders")}
        description={t("studio.ordersDescription")}
        icon="ticket"
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="ticket"
          title={t("studio.emptyOrders")}
          description={t("studio.emptyOrdersDescription")}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((order) => {
            const label = t(statusLabelKey(order.status));
            const hintKey = pipelineHintKey(order.status);
            const showPayable = order.status === "paid" || order.status === "unlocked";
            const shortId = order.id.length > 10 ? `${order.id.slice(0, 8)}…` : order.id;

            return (
              <li key={order.id}>
                <Card className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">{order.beatTitle}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                        <span>{t(`sku.${order.sku}`)}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {t("studio.colGmv")}:{" "}
                          <Price amount={order.gmvVnd} tone="seller" className="inline text-sm" />
                        </span>
                      </p>
                    </div>
                    <Badge variant={statusBadge(order.status)}>{label}</Badge>
                  </div>

                  {hintKey ? <p className="text-xs text-muted">{t(hintKey)}</p> : null}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      {t("studio.orderId")}:{" "}
                      <span className="font-mono text-foreground">{shortId}</span>
                    </span>
                    <span aria-hidden>·</span>
                    <span>
                      {t("studio.colDate")}: {formatOrderDate(order.createdAt, locale)}
                    </span>
                    {showPayable ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {t("studio.colPayable")}:{" "}
                          <Price
                            amount={order.payableVnd}
                            tone="seller"
                            className="inline text-xs"
                          />
                        </span>
                      </>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
