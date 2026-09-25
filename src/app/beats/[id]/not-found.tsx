import Link from "next/link";
import { buttonClass, Container, EmptyState, Icon } from "@/kit";
import { getT } from "@/i18n/get-locale";

/** Route-level 404 for bogus `/beats/[id]` — VN (or EN) guidance; MarketTopBar stays via root layout. */
export default function BeatNotFound() {
  const t = getT();
  return (
    <Container className="py-10 fade-in">
      <EmptyState
        icon="music"
        title={t("beat.notFoundTitle")}
        description={t("beat.notFoundDescription")}
        action={
          <Link href="/" className={buttonClass({ className: "rounded-full" })}>
            <Icon name="back" size="sm" />
            {t("beat.backExplore")}
          </Link>
        }
      />
    </Container>
  );
}
