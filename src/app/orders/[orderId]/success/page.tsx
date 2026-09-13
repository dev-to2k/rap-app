import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";
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

  const kinds: Array<"pdf" | "mp3" | "wav" | "stems"> = ["pdf", "mp3"];
  if (order.sku === "wav" || order.sku === "exclusive") kinds.push("wav", "stems");

  const downloads = kinds.map((fileKind) => {
    const { token } = createDownloadToken({
      licenseId: order.license!.id,
      beatId: order.beatId,
      sku: order.sku,
      fileKind,
    });
    return { fileKind, url: `/api/download/${token}` };
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title={t("success.paid")} icon="sparkles" />
      <p className="text-muted">
        {order.beat.title} · {t(`sku.${order.sku}`)} · <Price amount={order.amountVnd} className="text-base" />
      </p>
      <Card className="space-y-2 p-4">
        {downloads.map((d) => (
          <a key={d.fileKind} href={d.url} className={buttonClass({ className: "w-full" })}>
            {t("success.download", { kind: d.fileKind.toUpperCase() })}
          </a>
        ))}
      </Card>
      <Link href="/library" className={buttonClass({ variant: "ghost", size: "sm" })}>
        {t("success.toLibrary")}
      </Link>
    </div>
  );
}
