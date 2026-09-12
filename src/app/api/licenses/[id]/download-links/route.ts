import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const license = await prisma.license.findUnique({
    where: { id: params.id },
    include: { order: true },
  });
  if (!license || license.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (license.order.status !== "unlocked") {
    return NextResponse.json({ error: "Not unlocked" }, { status: 403 });
  }

  const kinds: Array<"mp3" | "wav" | "stems" | "pdf"> = ["pdf"];
  if (license.sku === "lease") kinds.unshift("mp3");
  if (license.sku === "wav" || license.sku === "exclusive") kinds.unshift("mp3", "wav", "stems");

  const links = kinds.map((fileKind) => {
    const { token, expiresAt } = createDownloadToken({
      licenseId: license.id,
      beatId: license.beatId,
      sku: license.sku,
      fileKind,
    });
    return {
      fileKind,
      url: `/api/download/${token}`,
      expiresAt,
    };
  });

  return NextResponse.json({ links });
}
