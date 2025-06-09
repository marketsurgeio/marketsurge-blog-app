import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PublishButtonProps {
  title: string;
  content: string;
  thumbnailUrl: string;
  industry: string;
  onSuccess?: (data: {
    ghl: { id: string; url: string };
  }) => void;
}

export function PublishButton({
  title,
  content,
  thumbnailUrl,
  industry,
  onSuccess,
}: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          thumbnailUrl,
          industry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      toast.success('Post published successfully!', {
        description: (
          <div className="mt-2 space-y-2">
            <p>
              <a
                href={data.ghl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View on GoHighLevel
              </a>
            </p>
          </div>
        ),
      });

      onSuccess?.(data);
    } catch (error) {
      console.error('Publishing error:', error);
      toast.error('Failed to publish post', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={isPublishing}
      className="w-full sm:w-auto"
    >
      {isPublishing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Publishing...
        </>
      ) : (
        'Publish Post'
      )}
    </Button>
  );
} 