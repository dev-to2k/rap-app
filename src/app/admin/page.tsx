import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Alert, Container, PageHeader } from "@/kit";
import { AdminConfirmOrders } from "@/components/AdminConfirmOrders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireUser(["admin"]);

  if (!admin) {
    return (
      <Container className="mx-auto max-w-md space-y-4 py-8">
        <PageHeader title="Admin" description="Chỉ tài khoản admin." icon="ticket" />
        <Alert variant="danger">
          <p className="font-semibold">Forbidden</p>
          <p className="mt-1 text-sm">
            Bạn cần đăng nhập bằng tài khoản{" "}
            <span className="font-mono">admin</span>.
          </p>
          <p className="mt-3">
            <Link href="/login?next=/admin" className="text-accent underline">
              Đăng nhập
            </Link>
          </p>
        </Alert>
      </Container>
    );
  }

  return <AdminConfirmOrders />;
}
