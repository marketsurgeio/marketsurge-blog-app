import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { checkUsageLimit } from '@/lib/usage';
import { getPromptTemplate } from '@/lib/prompts';

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
    const { title, industry } = body;

    if (!title || !industry) {
      console.error('Article API: Missing required fields', { title, industry });
      return NextResponse.json(
        { error: 'Title and industry are required' },
        { status: 400 }
      );
    }

    // Check usage limits
    const { canGenerate, remainingBudget } = await checkUsageLimit(userId);
    if (!canGenerate) {
      console.error('Article API: Usage limit exceeded for user:', userId);
      return NextResponse.json(
        { error: 'Daily budget exceeded', remainingBudget },
        { status: 429 }
      );
    }

    // Get prompt template
    const promptTemplate = await getPromptTemplate(industry);
    if (!promptTemplate) {
      console.error('Article API: No prompt template found for industry:', industry);
      return NextResponse.json(
        { error: 'No prompt template found for this industry' },
        { status: 400 }
      );
    }

    // Format the prompt
    const prompt = promptTemplate.replace('{title}', title);

    console.log('Article API: Generating article with prompt:', prompt);

    // Generate the article
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer specializing in creating engaging, informative articles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const articleContent = completion.choices[0]?.message?.content || '';

    // Store the article data
    const articleData = {
      title,
      content: articleContent,
      industry,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    console.log('Article API: Storing article data for user:', userId);
    articleStorage.set(userId, articleData);

    return NextResponse.json(articleData);
  } catch (error: any) {
    console.error('Article API: Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article', details: error.message },
      { status: 500 }
    );
  }
} 