import { Container, PageHeader } from "@/kit";
import { UploadForm } from "@/components/UploadForm";
import { getT } from "@/i18n/get-locale";

export default function UploadPage() {
  const t = getT();
  return (
    <Container className="py-8">
      <PageHeader title={t("upload.title")} description={t("upload.description")} icon="upload" />
      <UploadForm />
    </Container>
  );
}
