'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PromptForm from '@/components/PromptForm';
import IdeaCard from '@/components/IdeaCard';
import { IdeasLoading } from '@/components/loading/ideas-loading';
import { retry } from '@/lib/api-retry';
import { APIError, getErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';

interface BlogData {
  topic: string;
  industry: string;
  ideas: string[];
  selectedIdea: string | null;
  article: string | null;
  thumbnailUrl: string;
  status: 'draft' | 'published';
  youtubeUrl?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [blogData, setBlogData] = useState<BlogData>({
    topic: '',
    industry: 'General',
    ideas: [],
    selectedIdea: null,
    article: null,
    thumbnailUrl: '',
    status: 'draft',
    youtubeUrl: ''
  });

  const generateIdeas = async (values: { topic: string; industry: string; youtubeUrl?: string }) => {
    const trimmedTopic = values.topic.trim();
    const trimmedIndustry = values.industry.trim();

    if (!trimmedTopic || !trimmedIndustry) {
      toast.error('Please fill in all required fields (Topic and Industry)');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting form with values:', { topic: trimmedTopic, industry: trimmedIndustry });
      
      const response = await fetch(`${window.location.origin}/api/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          industry: trimmedIndustry,
          youtubeUrl: values.youtubeUrl
        }),
      });

      console.log('Received response:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new APIError(
          errorData.error || 'Failed to generate ideas',
          response.status,
          errorData.code || 'SERVER_ERROR',
          errorData.details
        );
      }

      const data = await response.json();
      console.log('Received ideas:', data.ideas);
      
      if (!data.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0) {
        throw new APIError('No ideas were generated', 500, 'NO_IDEAS');
      }

      setBlogData(prev => ({ 
        ...prev, 
        topic: trimmedTopic,
        industry: trimmedIndustry,
        youtubeUrl: values.youtubeUrl,
        ideas: data.ideas
      }));
      
      logger.info('Generated blog ideas', { topic: trimmedTopic, industry: trimmedIndustry });
    } catch (error) {
      console.error('Error in generateIdeas:', error);
      const apiError = error instanceof APIError ? error : new APIError('Failed to generate ideas', 500, 'SERVER_ERROR');
      toast.error(getErrorMessage(apiError));
      logger.error('Failed to generate ideas', { 
        error: apiError, 
        topic: trimmedTopic, 
        industry: trimmedIndustry,
        details: apiError.details 
      });
    } finally {
      setLoading(false);
    }
  };

  const generateArticle = async (idea: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea,
          keywords: idea.split(' '),
          industry: blogData.industry,
          youtubeUrl: blogData.youtubeUrl
        }),
      });

      if (!response.ok) {
        throw new APIError('Failed to generate article', response.status, 'API_ERROR');
      }

      const { article } = await response.json();
      setBlogData(prev => ({ ...prev, article, selectedIdea: idea }));
      router.push('/generate/preview');
      logger.info('Generated article', { title: idea });
    } catch (error) {
      const apiError = error instanceof APIError ? error : new APIError('Failed to generate article', 500, 'SERVER_ERROR');
      toast.error(getErrorMessage(apiError));
      logger.error('Failed to generate article', { error: apiError, title: idea });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Blog Post Generator</h1>
      
      {blogData.ideas.length === 0 ? (
        <PromptForm
          onSubmit={generateIdeas}
          loading={loading}
        />
      ) : (
        <div className="space-y-4">
          {loading ? (
            <IdeasLoading />
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-6">Select an Idea</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogData.ideas.map((idea, index) => (
                  <IdeaCard
                    key={index}
                    title={idea}
                    selected={blogData.selectedIdea === idea}
                    loading={loading && blogData.selectedIdea === idea}
                    onClick={() => generateArticle(idea)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
} 