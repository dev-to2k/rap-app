import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { Alert, Container } from "@/kit";
import { MarketplaceHome } from "@/components/MarketplaceHome";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const t = getT();
  let beats: Array<{
    id: string;
    title: string;
    coverUrl: string | null;
    audioUrl: string;
    bpm: number;
    musicalKey: string;
    priceLease: number;
    priceWav: number;
    priceExclusive: number;
    status: string;
    sampleFlag: string;
    producer: { name: string };
  }> = [];
  let dbUnavailable = !hasDatabaseUrl();

  if (!dbUnavailable) {
    try {
      beats = await prisma.beat.findMany({
        where: { status: "available" },
        include: { producer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      dbUnavailable = true;
      beats = [];
    }
  }

  return (
    <div>
      {dbUnavailable && process.env.NODE_ENV === "development" ? (
        <Container className="pt-6">
          <Alert variant="warning">{t("home.dbUnavailable")}</Alert>
        </Container>
      ) : null}
      <MarketplaceHome beats={beats} initialQuery={searchParams.q || ""} />
    </div>
  );
}
