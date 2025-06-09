'use client';

import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'sonner';

interface PromptFormProps {
  onSubmit: (values: { topic: string; industry: string; youtubeUrl?: string }) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function PromptForm({ onSubmit, loading, error, onRetry }: PromptFormProps) {
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [knowledgeBaseContent, setKnowledgeBaseContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTopic = topic.trim();
    const trimmedIndustry = industry.trim();
    const trimmedYoutubeUrl = youtubeUrl.trim();

    if (!trimmedTopic || !trimmedIndustry) {
      toast.error('Please fill in both Topic and Industry fields');
      return;
    }

    onSubmit({
      topic: trimmedTopic,
      industry: trimmedIndustry,
      youtubeUrl: trimmedYoutubeUrl || undefined
    });
  };

  const handleKnowledgeBaseClick = async () => {
    try {
      const response = await fetch('/api/knowledge-base');
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base');
      }
      const data = await response.json();
      setKnowledgeBaseContent(data.content);
      setShowKnowledgeBase(true);
    } catch (error) {
      toast.error('Failed to load knowledge base');
    }
  };

  const handleSaveKnowledgeBase = async () => {
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to save knowledge base');
      }

      setKnowledgeBaseContent(editedContent);
      setIsEditing(false);
      toast.success('Knowledge base updated successfully');
    } catch (error) {
      toast.error('Failed to save knowledge base');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Digital Marketing, SEO, Social Media"
            required
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the main topic for your blog post
          </p>
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Technology, Healthcare, Real Estate"
            required
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Specify the industry or niche for your content
          </p>
        </div>

        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Video URL (Optional)
          </label>
          <input
            type="url"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., https://www.youtube.com/watch?v=..."
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Add a YouTube video to be embedded in the article
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              type="submit"
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
                  Generating...
                </span>
              ) : (
                'Generate Ideas'
              )}
            </button>
            <button
              type="button"
              onClick={handleKnowledgeBaseClick}
              className="px-6 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
            >
              View/Edit Knowledge Base
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {showKnowledgeBase && knowledgeBaseContent && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Knowledge Base</h3>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveKnowledgeBase}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(knowledgeBaseContent);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap">{knowledgeBaseContent}</pre>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
} 