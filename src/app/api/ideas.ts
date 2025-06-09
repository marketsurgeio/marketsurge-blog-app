import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getIdeas } from '@/lib/openai';
import { costGuard } from '@/lib/costGuard';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user (Clerk JWT)
    const auth = getAuth(req);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = auth.userId;

    // 2. Parse request body
    const { topic, industry } = await req.json();
    if (!topic || !industry) {
      return NextResponse.json({ error: 'Missing topic or industry' }, { status: 400 });
    }

    // 3. Estimate token usage (rough estimate: 100 tokens per idea)
    const estimatedTokens = 300;
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      return NextResponse.json({ error: 'Budget exceeded' }, { status: 403 });
    }

    // 4. Call OpenAI ideas util
    const ideasResponse = await getIdeas(topic, industry);

    // 5. Return ideas
    return NextResponse.json({ ideas: ideasResponse.titles });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 