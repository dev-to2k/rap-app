import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
import { Alert, buttonClass, Card, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function LicenseSuccessPage({ params }: { params: { id: string } }) {
  const t = getT();
  const user = await getSession();
  if (!user) redirect(`/login?next=/license/${params.id}`);

  const license = await prisma.license.findUnique({
    where: { id: params.id },
    include: {
      order: true,
      buyer: true,
    },
  });
  if (!license || license.buyerId !== user.id) notFound();

  const beat = await prisma.beat.findUnique({
    where: { id: license.beatId },
    include: { producer: { select: { name: true } } },
  });
  if (!beat) notFound();

  return (
    <div className="space-y-5">
      <Alert variant="success" className="p-6 text-center">
        <div className="text-3xl text-accent">✓</div>
        <h1 className="mt-2 text-xl font-bold text-foreground">{t("license.unlocked")}</h1>
        <p className="mt-1 text-sm text-muted">{t("license.paidWebhook")}</p>
      </Alert>

      <Card className="space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("license.beat")}</span>
          <span className="text-foreground">{beat.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("license.sku")}</span>
          <span className="text-foreground">{t(`sku.${license.sku}`)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("license.paid")}</span>
          <Price amount={license.order.amountVnd} className="text-sm" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("license.licenseId")}</span>
          <span className="font-mono text-xs text-muted">{license.id}</span>
        </div>
        {beat.sampleFlag === "uncleared" ? (
          <Alert variant="warning" className="p-2 text-xs">
            {t("license.unclearedPdf")}
          </Alert>
        ) : null}
      </Card>

      <DownloadButtons licenseId={license.id} />

      <Link href="/library" className={buttonClass({ variant: "secondary", className: "w-full" })}>
        {t("license.viewLibrary")}
      </Link>
    </div>
  );
}
