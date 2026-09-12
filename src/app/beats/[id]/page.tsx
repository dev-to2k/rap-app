import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BuyPanel } from "@/components/BuyPanel";
import { formatVnd } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function BeatDetailPage({ params }: { params: { id: string } }) {
  const beat = await prisma.beat.findUnique({
    where: { id: params.id },
    include: { producer: { select: { name: true } } },
  });
  if (!beat) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beat.coverUrl || "/covers/beat1.svg"}
          alt=""
          className="mb-4 aspect-square w-full max-w-md rounded-xl bg-zinc-800 object-cover"
        />
        <h1 className="text-3xl font-bold">{beat.title}</h1>
        <p className="mt-2 text-zinc-400">
          {beat.producer.name} · {beat.bpm} BPM · {beat.musicalKey} · sample: {beat.sampleFlag}
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          MP3 / WAV / Exclusive — Lease {formatVnd(beat.priceLease)} · WAV {formatVnd(beat.priceWav)} · Exclusive{" "}
          {formatVnd(beat.priceExclusive)}
        </p>
        {beat.audioUrl && (
          <audio className="mt-4 w-full" controls src={`/api/preview?path=${encodeURIComponent(beat.audioUrl)}`}>
            Preview
          </audio>
        )}
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
    </div>
  );
}
