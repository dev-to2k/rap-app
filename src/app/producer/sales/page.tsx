import Link from "next/link";
import { buttonClass, EmptyState, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default function ProducerSalesStub() {
  const t = getT();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t("sales.title")} description={t("sales.description")} icon="wallet" />
      <EmptyState
        icon="wallet"
        title={t("sales.emptyTitle")}
        description={t("sales.emptyDescription")}
        action={
          <Link href="/" className={buttonClass({ size: "sm" })}>
            {t("sales.catalog")}
          </Link>
        }
      />
    </div>
  );
}
