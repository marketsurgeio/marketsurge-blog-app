import { Skeleton } from "@/components/ui/skeleton";

export function ThumbnailLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
} 