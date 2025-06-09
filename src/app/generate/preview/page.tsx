'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PreviewData {
  title: string;
  content: string;
  html: string;
  industry: string;
  keywords: string[];
  youtubeUrl?: string;
}

export default function PreviewPage() {
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPreviewData();
  }, []);

  const fetchPreviewData = async () => {
    try {
      const response = await fetch('/api/article/preview');
      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!previewData) return;

    setPublishing(true);
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: previewData.title,
          content: previewData.content,
          industry: previewData.industry,
          keywords: previewData.keywords,
          youtubeUrl: previewData.youtubeUrl
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish article');
      }

      const data = await response.json();
      toast.success('Article published successfully!');
      router.push(`/posts/${data.id}`);
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish article');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">No Preview Available</h1>
        <p className="text-gray-600 mb-4">Please generate an article first.</p>
        <Button onClick={() => router.push('/generate')}>
          Generate Article
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{previewData.title}</h1>
        <Button
          onClick={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Article'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Formatted Article</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: previewData.content }}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">HTML Code</h2>
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded overflow-x-auto">
            <code>{previewData.html}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
} 