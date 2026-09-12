import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function ensurePlaceholderAudio() {
  const audioDir = path.join(process.cwd(), "storage", "audio");
  fs.mkdirSync(audioDir, { recursive: true });
  // Minimal valid-ish silent mp3 stub (tiny file; players may skip — demo OK)
  const stub = Buffer.from([
    0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const files = ["type-beat-1.mp3", "type-beat-2.mp3", "type-beat-3.mp3", "type-beat-4.mp3", "type-beat-5.mp3"];
  for (const f of files) {
    const p = path.join(audioDir, f);
    if (!fs.existsSync(p)) fs.writeFileSync(p, stub);
  }
}

async function main() {
  await ensurePlaceholderAudio();

  await prisma.waitlistSignup.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.license.deleteMany();
  await prisma.order.deleteMany();
  await prisma.beat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformConfig.deleteMany();

  const promoEnds = new Date();
  promoEnds.setDate(promoEnds.getDate() + 90);

  await prisma.platformConfig.create({
    data: {
      id: "default",
      takeRateBps: 1500,
      promoTakeRateBps: 1200, // optional 12% / 90d flag
      promoEndsAt: promoEnds,
    },
  });

  const pw = await bcrypt.hash("password123", 10);

  const producer1 = await prisma.user.create({
    data: { email: "producer@rap.app", name: "Ocherk Beats", password: pw, role: "producer" },
  });
  const producer2 = await prisma.user.create({
    data: { email: "minhprod@rap.app", name: "Minh Prod", password: pw, role: "producer" },
  });
  const buyer = await prisma.user.create({
    data: { email: "buyer@rap.app", name: "Rapper VN", password: pw, role: "buyer" },
  });

  const beats = [
    {
      title: "Saigon Nights Type Beat",
      coverUrl: "/covers/beat1.svg",
      audioUrl: "storage/audio/type-beat-1.mp3",
      wavUrl: "storage/audio/type-beat-1.mp3",
      stemsUrl: "storage/audio/type-beat-1.mp3",
      bpm: 140,
      musicalKey: "Am",
      sampleFlag: "clean",
      priceLease: 199000,
      priceWav: 599000,
      priceExclusive: 3000000,
      producerId: producer1.id,
    },
    {
      title: "Hanoi Drill",
      coverUrl: "/covers/beat2.svg",
      audioUrl: "storage/audio/type-beat-2.mp3",
      wavUrl: "storage/audio/type-beat-2.mp3",
      stemsUrl: "storage/audio/type-beat-2.mp3",
      bpm: 148,
      musicalKey: "F#m",
      sampleFlag: "uncleared",
      priceLease: 199000,
      priceWav: 599000,
      priceExclusive: 3500000,
      producerId: producer1.id,
    },
    {
      title: "Mekong Melodic",
      coverUrl: "/covers/beat3.svg",
      audioUrl: "storage/audio/type-beat-3.mp3",
      wavUrl: "storage/audio/type-beat-3.mp3",
      stemsUrl: "storage/audio/type-beat-3.mp3",
      bpm: 92,
      musicalKey: "Cmaj",
      sampleFlag: "clean",
      priceLease: 249000,
      priceWav: 699000,
      priceExclusive: 4000000,
      producerId: producer2.id,
    },
    {
      title: "District 7 Trap",
      coverUrl: "/covers/beat4.svg",
      audioUrl: "storage/audio/type-beat-4.mp3",
      wavUrl: "storage/audio/type-beat-4.mp3",
      stemsUrl: "storage/audio/type-beat-4.mp3",
      bpm: 155,
      musicalKey: "Dm",
      sampleFlag: "clean",
      priceLease: 179000,
      priceWav: 549000,
      priceExclusive: 2800000,
      producerId: producer2.id,
    },
    {
      title: "Pho Lo-Fi Loop",
      coverUrl: "/covers/beat5.svg",
      audioUrl: "storage/audio/type-beat-5.mp3",
      wavUrl: "storage/audio/type-beat-5.mp3",
      stemsUrl: "storage/audio/type-beat-5.mp3",
      bpm: 85,
      musicalKey: "Em",
      sampleFlag: "uncleared",
      priceLease: 159000,
      priceWav: 499000,
      priceExclusive: 2500000,
      producerId: producer1.id,
    },
  ];

  for (const b of beats) {
    await prisma.beat.create({ data: b });
  }

  console.log("Seed OK");
  console.log("Accounts (password: password123):");
  console.log("  producer@rap.app (producer)");
  console.log("  minhprod@rap.app (producer)");
  console.log("  buyer@rap.app (buyer)");
  console.log(`Buyer id: ${buyer.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
