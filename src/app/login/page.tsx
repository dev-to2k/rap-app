import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { Card, PageHeader } from "@/kit";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  if (user) redirect(searchParams.next || "/");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader
        title="Đăng nhập"
        description="Credentials stub · tài khoản demo bên dưới. Magic-link có thể thay sau."
      />
      <LoginForm next={searchParams.next || "/"} />
      <Card className="space-y-1 p-4 font-mono text-xs text-muted">
        <p className="font-sans font-medium text-foreground">Tài khoản seed (password: password123)</p>
        <p>buyer@rap.app — buyer</p>
        <p>producer@rap.app — producer</p>
        <p>minhprod@rap.app — producer</p>
      </Card>
    </div>
  );
}
