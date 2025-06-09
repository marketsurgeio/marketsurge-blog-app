'use client';

import React, { useState } from 'react';
import { isValidYoutubeUrl, getYoutubeEmbedUrl } from '@/lib/youtube';

interface YouTubePreviewProps {
  url: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function YouTubePreview({ url, onChange, className = '' }: YouTubePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(url);
  const [error, setError] = useState<string | null>(null);

  const embedUrl = getYoutubeEmbedUrl(url);

  const handleEdit = () => {
    setIsEditing(true);
    setEditUrl(url);
    setError(null);
  };

  const handleSave = () => {
    if (!editUrl.trim()) {
      onChange('');
      setIsEditing(false);
      return;
    }

    if (!isValidYoutubeUrl(editUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    onChange(editUrl);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditUrl(url);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <input
          type="url"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <button
        onClick={handleEdit}
        className={`text-blue-600 hover:text-blue-800 ${className}`}
      >
        + Add YouTube Video
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative aspect-video">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Invalid YouTube URL</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 truncate">{url}</p>
        <button
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Edit
        </button>
      </div>
    </div>
  );
} 