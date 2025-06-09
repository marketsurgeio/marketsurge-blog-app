import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { costGuard } from '@/lib/costGuard';
import { storeArticle } from '@/lib/storage';

// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
const articleStorage = new Map<string, any>();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Article API: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    console.log('Article API: Received request body:', body);
    
    const { title, industry, keywords, youtubeUrl } = body;
    if (!title || !industry) {
      console.error('Article API: Missing required fields:', { title, industry });
      return NextResponse.json(
        { error: 'Title and industry are required' },
        { status: 400 }
      );
    }

    // Check usage and budget
    const estimatedTokens = 2000; // Estimate 2000 tokens for article
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      console.error('Article API: Usage limit exceeded:', { userId, remainingBudget: canProceed });
      return NextResponse.json(
        { error: 'Daily budget exceeded' },
        { status: 429 }
      );
    }

    try {
      // Generate article using OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Write an engaging, informative article titled "${title}" for the ${industry} industry.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log('Article API: Received completion from OpenAI');

      if (!completion.choices[0].message.content) {
        throw new Error('No content in OpenAI response');
      }

      const articleData = {
        title,
        industry,
        content: completion.choices[0].message.content,
        keywords: keywords || [],
        youtubeUrl: youtubeUrl || null,
        createdAt: new Date().toISOString()
      };

      // Store the article data
      await storeArticle(userId, articleData);

      return NextResponse.json(articleData);
    } catch (error: any) {
      console.error('Article API: Error in OpenAI request:', error);
      
      // Handle specific error types
      if (error?.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or missing' },
          { status: 500 }
        );
      }
      
      if (error?.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate article',
          details: error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Article API: Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 