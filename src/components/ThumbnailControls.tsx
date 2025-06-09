'use client';

import { useState } from 'react';
import { generateThumbnailAction } from '@/app/actions/thumbnail';

interface ThumbnailControlsProps {
  title: string;
  initialGradient: { start: string; end: string };
}

export function ThumbnailControls({ title }: ThumbnailControlsProps) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      await generateThumbnailAction(title);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
    >
      {loading ? 'Generating...' : 'New Background'}
    </button>
  );
} 