import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4 w-full", className)}
      {...props}
    />
  );
}

export function SkeletonTitle({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-8 w-3/4", className)}
      {...props}
    />
  );
}

export function SkeletonParagraph({ className, ...props }: SkeletonProps) {
  return (
    <div className="space-y-2">
      <SkeletonText className={className} {...props} />
      <SkeletonText className={className} {...props} />
      <SkeletonText className={cn("w-2/3", className)} {...props} />
    </div>
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <SkeletonTitle className="mb-4" />
      <SkeletonParagraph />
    </div>
  );
} 