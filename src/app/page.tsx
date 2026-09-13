import Link from "next/link";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { Alert, buttonClass, EmptyState, PageHeader } from "@/kit";
import { BeatCard } from "@/components/BeatCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let beats: Array<{
    id: string;
    title: string;
    coverUrl: string | null;
    audioUrl: string;
    bpm: number;
    musicalKey: string;
    priceLease: number;
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
      {dbUnavailable ? (
        <Alert variant="warning" className="mb-6">
          Database chưa sẵn sàng trên deploy này (thiếu <code>DATABASE_URL</code>). Demo local/tunnel vẫn dùng được; Vercel cần Neon + redeploy.
        </Alert>
      ) : null}
      <PageHeader
        title="Beats đang bán"
        description="MP3 nghe thử / WAV làm bài / Exclusive giữ một mình — giá VND, license rõ."
        action={
          <Link href="/upload" className={buttonClass({ size: "sm" })}>
            Đăng beat
          </Link>
        }
      />

      {beats.length === 0 ? (
        <EmptyState
          title="Chưa có beat nào"
          description="Đừng inbox hỏi beat nữa — chọn gói, trả MoMo, nhận PDF + file."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {beats.map((b) => (
            <BeatCard
              key={b.id}
              id={b.id}
              title={b.title}
              coverUrl={b.coverUrl}
              producer={b.producer.name}
              bpm={b.bpm}
              musicalKey={b.musicalKey}
              price={b.priceLease}
              audioUrl={b.audioUrl}
              sampleFlag={b.sampleFlag}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
