import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
import { Alert, buttonClass, Card, PageHeader, Price } from "@/kit";
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
      <p className="text-muted">
        {order.beat.title} · {t(`sku.${order.sku}`)} · <Price amount={order.amountVnd} className="text-base" />
      </p>
      <Card className="p-4">
        <DownloadButtons licenseId={order.license.id} />
      </Card>
      <Link href="/library" className={buttonClass({ variant: "ghost", size: "sm" })}>
        {t("success.toLibrary")}
      </Link>
    </div>
  );
}
