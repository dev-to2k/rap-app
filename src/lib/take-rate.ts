import { prisma } from "./prisma";
import { DEFAULT_TAKE_RATE_BPS, PROMO_TAKE_RATE_BPS } from "./config";

export async function getEffectiveTakeRateBps(): Promise<number> {
  const cfg = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  if (!cfg) return DEFAULT_TAKE_RATE_BPS;
  if (
    cfg.promoTakeRateBps != null &&
    cfg.promoEndsAt &&
    cfg.promoEndsAt.getTime() > Date.now()
  ) {
    return cfg.promoTakeRateBps;
  }
  return cfg.takeRateBps ?? DEFAULT_TAKE_RATE_BPS;
}

export { PROMO_TAKE_RATE_BPS };
