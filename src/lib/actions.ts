"use server";

import { getSession } from "@/lib/auth";
import { createMarketplaceOrder } from "@/lib/orders";

export async function createOrderAction(beatId: string, sku: "lease" | "wav" | "exclusive") {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const order = await createMarketplaceOrder({
    buyerId: session.id,
    beatId,
    sku,
  });
  return order.id;
}
