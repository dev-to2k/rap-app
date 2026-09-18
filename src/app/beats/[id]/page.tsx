import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BuyPanel } from "@/components/BuyPanel";
import { BeatPlayer } from "@/components/BeatPlayer";
import { Badge, Container, Icon } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function BeatDetailPage({ params }: { params: { id: string } }) {
  const t = getT();
  const beat = await prisma.beat.findUnique({
    where: { id: params.id },
    include: { producer: { select: { name: true } } },
  });
  if (!beat) notFound();

  return (
    <Container className="content-max space-y-6 py-5 fade-in">
      <Link
        href="/"
        className="tap-target inline-flex items-center gap-1 text-sm text-muted transition-fade hover:text-foreground"
      >
        <Icon name="back" size="sm" />
        {t("common.back")}
      </Link>

      <BeatPlayer
        id={beat.id}
        title={beat.title}
        producer={beat.producer.name}
        coverUrl={beat.coverUrl}
        audioUrl={beat.audioUrl}
      />

      <div className="space-y-2">
        <Badge variant="accent">BEAT</Badge>
        <h1 className="font-display text-[28px] font-extrabold leading-[34px] tracking-tight">
          {beat.title}
        </h1>
        <p className="text-[15px] text-foreground/90">Prod. by {beat.producer.name}</p>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
          <span>{beat.bpm} BPM</span>
          <span>{beat.musicalKey}</span>
        </p>
        <p className="pt-1">
          {beat.sampleFlag === "uncleared" ? (
            <Badge variant="warning">uncleared</Badge>
          ) : (
            <Badge variant="accent">clean</Badge>
          )}
        </p>
      </div>

      <BuyPanel
        beat={{
          id: beat.id,
          priceLease: beat.priceLease,
          priceWav: beat.priceWav,
          priceExclusive: beat.priceExclusive,
          sampleFlag: beat.sampleFlag,
          status: beat.status,
        }}
      />
    </Container>
  );
}
