'use client';

import { useState, useEffect } from 'react';
import { generateThumbnailAction, getRandomGradient } from '@/app/actions/thumbnail';
import Image from 'next/image';

interface ThumbnailPreviewProps {
  title: string;
}

export default function ThumbnailPreview({ title }: ThumbnailPreviewProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundGradient, setBackgroundGradient] = useState(getRandomGradient());

  function generateThumbnail() {
    setLoading(true);
    setError(null);
    generateThumbnailAction(title)
      .then(result => {
        if (result.success && result.data) {
          setThumbnailUrl(result.data);
        } else {
          throw new Error(result.error || 'Failed to generate thumbnail');
        }
      })
      .catch(error => {
        console.error('Error generating thumbnail:', error);
        setError('Failed to generate thumbnail. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    generateThumbnail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, backgroundGradient]);

  const handleRegenerate = () => {
    setBackgroundGradient(getRandomGradient());
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Featured Image</h3>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'New Background'}
        </button>
      </div>
      <div className="relative aspect-[1200/628] max-w-2xl bg-gray-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt="Blog post thumbnail"
            className="w-full h-full object-cover"
            width={1200}
            height={628}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {error || 'Failed to generate thumbnail'}
          </div>
        )}
      </div>
    </div>
  );
} 