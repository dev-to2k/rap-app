import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BuyPanel } from "@/components/BuyPanel";
import { BeatPlayer } from "@/components/BeatPlayer";
import { Badge, Container } from "@/kit";

export const dynamic = "force-dynamic";

export default async function BeatDetailPage({ params }: { params: { id: string } }) {
  const beat = await prisma.beat.findUnique({
    where: { id: params.id },
    include: { producer: { select: { name: true } } },
  });
  if (!beat) notFound();

  return (
    <Container className="grid gap-8 py-8 md:grid-cols-2">
      <div>
        <BeatPlayer
          id={beat.id}
          title={beat.title}
          producer={beat.producer.name}
          coverUrl={beat.coverUrl}
          audioUrl={beat.audioUrl}
        />
        <h1 className="text-3xl font-bold tracking-tight">{beat.title}</h1>
        <p className="mt-2 text-muted">
          {beat.producer.name} · {beat.bpm} BPM · {beat.musicalKey}
        </p>
        <p className="mt-2">
          {beat.sampleFlag === "uncleared" ? (
            <Badge variant="warning">uncleared</Badge>
          ) : (
            <Badge variant="accent">clean</Badge>
          )}
        </p>
      </div>
      <div className="md:sticky md:top-20 md:self-start">
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
      </div>
    </Container>
  );
}
