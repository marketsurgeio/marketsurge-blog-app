'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PreviewData {
  title: string;
  article: string;
  thumbnailUrl: string;
  status: 'draft' | 'published';
}

export default function PreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
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
        router.push('/generate');
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewData();
  }, [router]);

  const handlePublish = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: previewData.title,
          content: previewData.article,
          thumbnailUrl: previewData.thumbnailUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish article');
      }

      toast.success('Article published successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Preview Available</h1>
        <p className="text-gray-600 mb-8">Please generate an article first.</p>
        <button
          onClick={() => router.push('/generate')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Generate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Preview Article</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/generate')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Publishing...
              </span>
            ) : (
              'Publish Article'
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{previewData.title}</h2>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: previewData.article }}
        />
      </div>
    </div>
  );
} 