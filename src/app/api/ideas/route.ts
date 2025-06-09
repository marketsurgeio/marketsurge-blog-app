import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { costGuard } from '@/lib/costGuard';
import { getPromptById, formatPrompt } from '@/lib/prompts/marketsurge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Authentication failed: No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { topic, industry } = body;
    if (!topic || !industry) {
      console.error('Missing required fields:', { topic, industry });
      return NextResponse.json(
        { error: 'Topic and industry are required' },
        { status: 400 }
      );
    }

    // Check usage and budget
    const estimatedTokens = 1000; // Estimate 1000 tokens for ideas
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      console.error('Usage limit exceeded:', { userId, remainingBudget: canProceed });
      return NextResponse.json(
        { error: 'Daily budget exceeded' },
        { status: 429 }
      );
    }

    // Get and format the prompt
    const promptTemplate = getPromptById('blog-ideas');
    if (!promptTemplate) {
      console.error('Prompt template not found');
      return NextResponse.json(
        { error: 'Prompt template not found' },
        { status: 500 }
      );
    }

    const formattedPrompt = formatPrompt(promptTemplate.template, {
      topic,
      industry,
    });

    console.log('Sending prompt to OpenAI:', formattedPrompt);

    // Generate ideas using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: formattedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Received completion from OpenAI:', completion.choices[0].message);

    const ideas = completion.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '')); // Remove numbering

    if (!ideas || ideas.length === 0) {
      console.error('No ideas generated from OpenAI response');
      return NextResponse.json(
        { error: 'Failed to generate ideas from OpenAI response' },
        { status: 500 }
      );
    }

    console.log('Generated ideas:', ideas);
    return NextResponse.json({ ideas });
  } catch (error: any) {
    console.error('Error generating ideas:', error);
    
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

    // Handle Firebase errors
    if (error?.code?.startsWith('firebase/')) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate ideas',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 