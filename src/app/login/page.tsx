import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  if (user) redirect(searchParams.next || "/");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Login</h1>
      <p className="text-sm text-zinc-400">
        Credentials stub · demo accounts bên dưới. Magic-link có thể thay sau.
      </p>
      <LoginForm next={searchParams.next || "/"} />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-xs text-zinc-400 space-y-1">
        <p className="font-medium text-zinc-300">Seed accounts (password: password123)</p>
        <p>buyer@rap.app — buyer</p>
        <p>producer@rap.app — producer</p>
        <p>minhprod@rap.app — producer</p>
      </div>
    </div>
  );
}
