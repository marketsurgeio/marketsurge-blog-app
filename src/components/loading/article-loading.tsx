import { SkeletonTitle, SkeletonParagraph, SkeletonText } from "@/components/ui/skeleton";

export function ArticleLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonTitle />
        <SkeletonText className="w-1/3" />
      </div>
      <div className="prose prose-lg max-w-none">
        <SkeletonParagraph />
        <SkeletonParagraph />
        <SkeletonParagraph />
        <SkeletonParagraph />
      </div>
    </div>
  );
} 