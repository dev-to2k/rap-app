import Link from "next/link";
import { buttonClass, EmptyState, PageHeader } from "@/kit";

export default function ProducerSalesStub() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Sales" description="Stub: đơn bán + Exclusive sold lock. Chi tiết sau." />
      <EmptyState
        title="Chưa có dashboard sales"
        description="Danh sách đơn và lock Exclusive sẽ lên ở bản sau."
        action={
          <Link href="/" className={buttonClass({ size: "sm" })}>
            ← Catalog
          </Link>
        }
      />
    </div>
  );
}
