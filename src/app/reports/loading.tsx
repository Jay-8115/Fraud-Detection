import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <AppLayout title="Audit Reports">
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </AppLayout>
  );
}
