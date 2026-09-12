import { prisma } from "./prisma";
import { generateLicensePdf } from "./pdf";
import path from "path";

/**
 * Idempotent unlock after verified webhook:
 * - amount/order already matched by caller
 * - creates license + PDF once
 * - exclusive: atomic sold WHERE status in (reserved, available) + delist + audit
 */
export async function unlockOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        beat: { include: { producer: true } },
        buyer: true,
        license: true,
      },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status === "unlocked" && order.license) {
      return { order, license: order.license, already: true as const };
    }
    if (order.status !== "paid" && order.status !== "unlocked") {
      throw new Error("ORDER_NOT_PAID");
    }

    if (order.sku === "exclusive") {
      // Atomic: only succeed if reserved (checkout) or still available
      const updated = await tx.beat.updateMany({
        where: { id: order.beatId, status: { in: ["available", "reserved"] }, sampleFlag: "clean" },
        data: { status: "sold_exclusive" },
      });
      if (updated.count !== 1) {
        const beat = await tx.beat.findUnique({ where: { id: order.beatId } });
        if (beat?.sampleFlag === "uncleared") throw new Error("EXCLUSIVE_FORBIDDEN_UNCLEARED");
        throw new Error("EXCLUSIVE_CONFLICT");
      }
      await tx.auditLog.create({
        data: {
          beatId: order.beatId,
          action: "exclusive_sold",
          meta: JSON.stringify({ orderId: order.id, buyerId: order.buyerId }),
        },
      });
    }

    let license = order.license;
    if (!license) {
      license = await tx.license.create({
        data: {
          orderId: order.id,
          buyerId: order.buyerId,
          beatId: order.beatId,
          sku: order.sku,
        },
      });
    }

    const pdfPath = await generateLicensePdf({
      licenseId: license.id,
      buyerName: order.buyer.name,
      buyerEmail: order.buyer.email,
      producerName: order.beat.producer.name,
      beatTitle: order.beat.title,
      sku: order.sku,
      amountVnd: order.amountVnd,
      sampleFlag: order.beat.sampleFlag,
      orderId: order.id,
    });

    const rel = path.relative(process.cwd(), pdfPath);
    const updatedLicense = await tx.license.update({
      where: { id: license.id },
      data: { pdfPath: rel },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "unlocked" },
      include: { beat: { include: { producer: true } }, buyer: true, license: true },
    });

    await tx.auditLog.create({
      data: {
        beatId: order.beatId,
        action: "license_unlocked",
        meta: JSON.stringify({ orderId: order.id, licenseId: license.id, sku: order.sku }),
      },
    });

    return { order: updatedOrder, license: updatedLicense, already: false as const };
  });
}
