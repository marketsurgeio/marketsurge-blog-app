'use client';

import React, { useState } from 'react';
import YouTubePreview from './YouTubePreview';
import ProgressBar from './ProgressBar';
import ConfirmDialog from './ConfirmDialog';
import ThumbnailPreview from './ThumbnailPreview';

interface DraftPreviewProps {
  content: string;
  youtubeUrl?: string;
  title: string;
  loading: boolean;
  onRegenerate: () => void;
  onPublish: () => void;
  onYoutubeUrlChange: (url: string) => void;
}

export default function DraftPreview({
  content,
  youtubeUrl = '',
  title,
  loading,
  onRegenerate,
  onPublish,
  onYoutubeUrlChange,
}: DraftPreviewProps) {
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const handlePublishClick = () => {
    setShowPublishConfirm(true);
  };

  const handlePublishConfirm = () => {
    setShowPublishConfirm(false);
    onPublish();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Article Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            onClick={handlePublishClick}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {loading && <ProgressBar />}

      {/* Thumbnail Preview */}
      <ThumbnailPreview title={title} />

      {/* Article Content */}
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* YouTube Video */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">YouTube Video</h3>
        <YouTubePreview
          url={youtubeUrl}
          onChange={onYoutubeUrlChange}
          className="max-w-2xl"
        />
      </div>

      <ConfirmDialog
        isOpen={showPublishConfirm}
        title="Publish Article"
        message="Are you sure you want to publish this article? This action cannot be undone."
        onConfirm={handlePublishConfirm}
        onCancel={() => setShowPublishConfirm(false)}
      />
    </div>
  );
} 