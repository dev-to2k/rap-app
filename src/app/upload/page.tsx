import { PageHeader } from "@/kit";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div>
      <PageHeader
        title="Đăng beat"
        description="Up beat · set 3 giá VND · tự khai sample · bán có PDF."
      />
      <UploadForm />
    </div>
  );
}
