import { UploadForm } from "@/components/admin/upload-form";

export const metadata = { title: "Upload" };

export default function AdminUploadPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload video</h1>
        <p className="text-sm text-muted-foreground">
          The file goes to DoodStream with your title; description and tags are
          saved here.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
