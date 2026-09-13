import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Container, PageHeader } from "@/kit";
import { UploadForm } from "@/components/UploadForm";
import { getT } from "@/i18n/get-locale";

export default async function StudioUploadPage() {
  const user = await getSession();
  const t = getT();
  if (!user) redirect("/login?next=/studio/upload");
  return (
    <Container className="max-w-5xl py-8">
      <PageHeader title={t("upload.title")} description={t("upload.description")} icon="upload" />
      <UploadForm />
    </Container>
  );
}
