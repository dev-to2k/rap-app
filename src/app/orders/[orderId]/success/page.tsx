import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
import { CopyButton } from "@/components/CopyButton";
import { Alert, Badge, buttonClass, Card, PageHeader, Price, Stepper } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: { orderId: string } }) {
  const t = getT();
  const user = await getSession();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { license: true, beat: true },
  });
  if (!order || order.buyerId !== user.id) redirect("/library");

  if (order.status !== "unlocked" || !order.license) {
    return (
      <Alert variant="warning" className="text-center">
        <p className="text-lg text-foreground">{t("success.unpaid")}</p>
        <Link href={`/checkout/${order.id}`} className="mt-4 inline-block text-accent underline">
          {t("success.backCheckout")}
        </Link>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title={t("success.paid")} icon="sparkles" />
      {/* Bước 3/3 trong luồng mua */}
      <Stepper current={3} labels={[t("steps.choose"), t("steps.pay"), t("steps.done")]} />
      <p className="flex flex-wrap items-center gap-2 text-muted">
        <span>
          {order.beat.title} · {t(`sku.${order.sku}`)} ·{" "}
          <Price amount={order.amountVnd} className="text-base" />
        </span>
        <Badge variant="accent">{t("license.unlocked")}</Badge>
      </p>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted">
            {t("license.licenseId")}: <span className="font-mono text-foreground">{order.license.id}</span>
          </p>
          <CopyButton value={order.license.id} label={t("license.copyId")} copiedLabel={t("license.copied")} />
        </div>
        <DownloadButtons licenseId={order.license.id} />
      </Card>
      <Link href="/library" className={buttonClass({ variant: "ghost", size: "sm" })}>
        {t("success.toLibrary")}
      </Link>
    </div>
  );
}
