import Link from "next/link";

export default function ProducerSalesStub() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
      <p className="mt-2 text-[color:var(--muted)] text-sm">
        Stub: đơn bán + Exclusive sold lock. Chi tiết Design pack sau.
      </p>
      <Link href="/library" className="mt-6 inline-block text-sm text-[color:var(--accent)]">
        ← Library / catalog
      </Link>
    </main>
  );
}
