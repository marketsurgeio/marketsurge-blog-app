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

    try {
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

      if (!completion.choices[0].message.content) {
        throw new Error('No content in OpenAI response');
      }

      // Process the response to extract ideas
      const content = completion.choices[0].message.content.trim();
      console.log('Raw content:', content);

      // Split by newlines and clean up each line
      const ideas = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Remove any leading numbers and dots
          const cleanedLine = line.replace(/^\d+\.\s*/, '');
          console.log('Cleaned line:', cleanedLine);
          return cleanedLine;
        });

      console.log('Processed ideas:', ideas);

      if (!ideas || ideas.length === 0) {
        throw new Error('No ideas generated from OpenAI response');
      }

      // Ensure we have exactly 3 ideas
      const finalIdeas = ideas.slice(0, 3);
      console.log('Final ideas:', finalIdeas);

      return NextResponse.json({ ideas: finalIdeas });
    } catch (error: any) {
      console.error('Error in OpenAI request:', error);
      
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
  } catch (error: any) {
    console.error('Error in ideas API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 