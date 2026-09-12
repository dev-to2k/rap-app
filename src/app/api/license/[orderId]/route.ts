import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { orderId: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { license: true, beat: true },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "unlocked" || !order.license) {
    return NextResponse.json({ error: "Chưa thanh toán — file chưa mở.", status: order.status }, { status: 403 });
  }

  const kinds: Array<"mp3" | "wav" | "stems" | "pdf"> = ["pdf", "mp3"];
  if (order.sku === "wav" || order.sku === "exclusive") {
    kinds.push("wav", "stems");
  }

  const downloads = kinds.map((fileKind) => {
    const { token, expiresAt } = createDownloadToken({
      licenseId: order.license!.id,
      beatId: order.beatId,
      sku: order.sku,
      fileKind,
    });
    return { fileKind, url: `/api/download/${token}`, expiresAt };
  });

  return NextResponse.json({ order, license: order.license, downloads });
}
