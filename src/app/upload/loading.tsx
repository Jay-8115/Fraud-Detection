import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <AppLayout title="Upload & Analyze">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </AppLayout>
  );
}
