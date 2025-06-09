'use client';

import { PublishButton } from '@/components/publish-button';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ThumbnailOptions {
  title: string;
  industry: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  overlayOpacity: number;
}

export default function TestPublishPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [blogDetails, setBlogDetails] = useState<{
    id: string;
    name: string;
    url: string;
  } | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOptions>({
    title: 'Test Blog Post',
    industry: 'Technology',
    backgroundColor: '#f3f4f6',
    textColor: '#6b728b',
    fontSize: 48,
    overlayOpacity: 0.8,
  });

  const testGHLConnection = async () => {
    try {
      setIsTesting(true);
      const response = await fetch('/api/ghl/test');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test GHL connection');
      }

      setBlogDetails(data.blog);
      toast.success('GHL connection successful!', {
        description: `Connected to blog: ${data.blog.name}`,
      });
    } catch (error) {
      console.error('GHL test error:', error);
      toast.error('Failed to test GHL connection', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const generateThumbnail = async () => {
    try {
      setIsGeneratingThumbnail(true);
      const response = await fetch('/api/thumbnail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thumbnailOptions),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setThumbnailUrl(url);

      toast.success('Thumbnail generated successfully!');
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      toast.error('Failed to generate thumbnail', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const previewPost = () => {
    setIsPreviewing(true);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Publishing Flow</h1>

      <div className="space-y-8">
        {/* GHL Connection Test */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Test GHL Connection</h2>
          <Button
            onClick={testGHLConnection}
            disabled={isTesting}
            className="mb-4"
          >
            {isTesting ? 'Testing...' : 'Test GHL Connection'}
          </Button>

          {blogDetails && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <h3 className="font-medium text-green-800">Connection Successful</h3>
              <dl className="mt-2 space-y-1">
                <div>
                  <dt className="text-sm text-green-600">Blog Name</dt>
                  <dd className="text-sm text-green-900">{blogDetails.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-green-600">Blog ID</dt>
                  <dd className="text-sm text-green-900">{blogDetails.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-green-600">Blog URL</dt>
                  <dd className="text-sm text-green-900">
                    <a
                      href={blogDetails.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {blogDetails.url}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Thumbnail Generation */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. Generate Thumbnail</h2>
          
          {/* Thumbnail Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={thumbnailOptions.title}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={thumbnailOptions.industry}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={thumbnailOptions.backgroundColor}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={thumbnailOptions.textColor}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, textColor: e.target.value }))}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="24"
                max="72"
                value={thumbnailOptions.fontSize}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{thumbnailOptions.fontSize}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overlay Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={thumbnailOptions.overlayOpacity}
                onChange={(e) => setThumbnailOptions(prev => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{thumbnailOptions.overlayOpacity}</span>
            </div>
          </div>

          <Button
            onClick={generateThumbnail}
            disabled={isGeneratingThumbnail}
            className="mb-4"
          >
            {isGeneratingThumbnail ? 'Generating...' : 'Generate Thumbnail'}
          </Button>

          {thumbnailUrl && (
            <div className="mt-4">
              <Image
                src={thumbnailUrl}
                alt="Blog post thumbnail"
                className="w-full h-full object-cover"
                width={1200}
                height={628}
              />
            </div>
          )}
        </div>

        {/* Test Publishing */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. Test Publishing</h2>
          <p className="text-gray-600 mb-4">
            This will publish a test post to both WordPress and GoHighLevel.
          </p>

          <div className="space-y-4">
            <Button
              onClick={previewPost}
              className="mb-4"
            >
              Preview Post
            </Button>

            {isPreviewing && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Post Preview</h3>
                <div className="prose max-w-none">
                  <h2>Test Blog Post</h2>
                  <p>This is a test blog post to verify the publishing functionality.</p>
                  <h3>Features Being Tested:</h3>
                  <ul>
                    <li>WordPress publishing</li>
                    <li>GoHighLevel publishing</li>
                    <li>Thumbnail generation</li>
                    <li>Error handling</li>
                  </ul>
                  <p>If you&apos;re seeing this post, the publishing flow is working correctly!</p>
                </div>
                {thumbnailUrl && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Featured Image:</h4>
                    <Image
                      src={thumbnailUrl}
                      alt="Post thumbnail"
                      className="max-w-full h-auto rounded-lg shadow"
                      width={1200}
                      height={628}
                    />
                  </div>
                )}
              </div>
            )}

            <PublishButton
              title="Test Blog Post"
              content={`
                <h2>Test Blog Post</h2>
                <p>This is a test blog post to verify the publishing functionality.</p>
                <h3>Features Being Tested:</h3>
                <ul>
                  <li>WordPress publishing</li>
                  <li>GoHighLevel publishing</li>
                  <li>Thumbnail generation</li>
                  <li>Error handling</li>
                </ul>
                <p>If you&apos;re seeing this post, the publishing flow is working correctly!</p>
              `}
              thumbnailUrl={thumbnailUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjI4IiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNjAwIiB5PSIzMTQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgbGluZS1oZWlnaHQ9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyOGIiPlRlc3QgQmxvZyBQb3N0PC90ZXh0Pjwvc3ZnPg=='}
              categoryId={1}
              industry="Technology"
              onSuccess={(data) => {
                console.log('Published successfully:', data);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 