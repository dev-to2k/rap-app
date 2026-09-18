import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  assertMintAllowed,
  clientDownloadError,
  mintDownloadLinks,
} from "@/lib/download-mint";
import { DOWNLOAD_TTL_SECONDS } from "@/lib/config";

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
  if (!order.license) {
    return NextResponse.json({ error: "Chưa thanh toán — file chưa mở.", status: order.status }, { status: 403 });
  }

  const license = { ...order.license, order };
  const gate = assertMintAllowed(license, user.id);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, status: order.status }, { status: gate.status });
  }

  try {
    const downloads = await mintDownloadLinks(license);
    return NextResponse.json({
      order,
      license: order.license,
      downloads,
      ttlSeconds: DOWNLOAD_TTL_SECONDS,
      expiresAt: downloads.length ? Math.min(...downloads.map((d) => d.expiresAt)) : null,
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "error";
    console.error("license_order_mint_failed", code);
    return NextResponse.json(clientDownloadError(code), { status: 503 });
  }
}
