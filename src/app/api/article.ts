import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getArticle } from '@/lib/openai';
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
    const { title, keywords } = await req.json();
    if (!title || !keywords) {
      return NextResponse.json({ error: 'Missing title or keywords' }, { status: 400 });
    }

    // 3. Estimate token usage (rough estimate: 2000 tokens for a full article)
    const estimatedTokens = 2000;
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      return NextResponse.json({ error: 'Budget exceeded' }, { status: 403 });
    }

    // 4. Call OpenAI article util
    const articleResponse = await getArticle(title, keywords);

    // 5. Return article
    return NextResponse.json({ article: articleResponse.html });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 