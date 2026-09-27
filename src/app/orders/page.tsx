import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge, buttonClass, Card, Container, CoverArt, EmptyState, PageHeader, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

const CHECKOUT_STATUSES = new Set([
  "pending",
  "pending_ck",
  "awaiting_payment",
  "pending_confirm",
]);

const DONE_STATUSES = new Set(["unlocked", "paid"]);

function statusBadge(status: string): "accent" | "warning" | "danger" {
  if (status === "unlocked" || status === "paid") return "accent";
  if (status === "failed") return "danger";
  return "warning";
}

function statusLabelKey(status: string): string {
  const known = [
    "pending",
    "pending_ck",
    "awaiting_payment",
    "pending_confirm",
    "paid",
    "unlocked",
    "failed",
  ];
  return known.includes(status) ? `orders.status.${status}` : status;
}

export default async function BuyerOrdersPage() {
  const t = getT();
  const user = await getSession();
  if (!user) redirect("/login?next=/orders");

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: {
      beat: { select: { id: true, title: true, coverUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-8">
      <PageHeader title={t("orders.title")} description={t("orders.description")} icon="ticket" />
      {orders.length === 0 ? (
        <EmptyState
          icon="ticket"
          title={t("orders.emptyTitle")}
          description={t("orders.emptyDescription")}
          action={
            <Link href="/" className={buttonClass({ size: "sm" })}>
              {t("orders.browse")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const title = order.beat?.title || order.beatId;
            const label = t(statusLabelKey(order.status));
            const checkoutCta = CHECKOUT_STATUSES.has(order.status);
            const doneCta = DONE_STATUSES.has(order.status);
            const failed = order.status === "failed";

            return (
              <li key={order.id}>
                <Card className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <CoverArt
                      src={order.beat?.coverUrl || "/covers/beat1.svg"}
                      alt={title}
                      className="h-12 w-12 shrink-0 rounded-md"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">{title}</h2>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                        <span>{t(`sku.${order.sku}`)}</span>
                        <span>·</span>
                        <Price amount={order.amountVnd} className="text-sm" />
                        <span>·</span>
                        <Badge variant={statusBadge(order.status)}>{label}</Badge>
                      </p>
                    </div>
                  </div>

                  {failed ? <p className="text-sm text-danger">{t("orders.retryHint")}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    {checkoutCta ? (
                      <Link
                        href={`/checkout/${order.id}`}
                        className={buttonClass({ size: "sm", className: "tap-target" })}
                      >
                        {t("orders.continuePay")}
                      </Link>
                    ) : null}
                    {doneCta ? (
                      <>
                        <Link
                          href={`/orders/${order.id}/success`}
                          className={buttonClass({ size: "sm", className: "tap-target" })}
                        >
                          {t("orders.viewSuccess")}
                        </Link>
                        <Link
                          href="/library"
                          className={buttonClass({
                            variant: "ghost",
                            size: "sm",
                            className: "tap-target",
                          })}
                        >
                          {t("orders.toLibrary")}
                        </Link>
                      </>
                    ) : null}
                    {failed ? (
                      <Link
                        href={`/checkout/${order.id}`}
                        className={buttonClass({
                          variant: "secondary",
                          size: "sm",
                          className: "tap-target",
                        })}
                      >
                        {t("orders.retry")}
                      </Link>
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
