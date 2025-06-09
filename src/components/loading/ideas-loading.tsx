import { SkeletonCard, SkeletonTitle, SkeletonText } from "@/components/ui/skeleton";

export function IdeasLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SkeletonTitle />
        <SkeletonText className="w-1/2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
} 