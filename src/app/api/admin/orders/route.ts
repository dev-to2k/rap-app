import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALL_PENDING = ["pending_confirm", "pending_ck"] as const;

/** Admin: list orders awaiting CK confirm (default pending_confirm). */
export async function GET(req: NextRequest) {
  const user = await requireUser(["admin"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "pending_confirm";
  const where =
    status === "all_pending"
      ? { status: { in: [...ALL_PENDING] } }
      : { status };

  const orders = await prisma.order.findMany({
    where,
    include: {
      beat: { select: { id: true, title: true } },
      buyer: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}
