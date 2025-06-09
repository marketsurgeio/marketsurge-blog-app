import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { publishPost } from '@/lib/ghl';
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
    const { title, html, featuredImageUrl } = await req.json();
    if (!title || !html || !featuredImageUrl) {
      return NextResponse.json({ error: 'Missing title, html, or featuredImageUrl' }, { status: 400 });
    }

    // 3. Cost guard check (optional, e.g., 100 tokens)
    const estimatedTokens = 100;
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      return NextResponse.json({ error: 'Budget exceeded' }, { status: 403 });
    }

    // 4. Publish post to GHL
    const result = await publishPost({ title, html, featuredImageUrl, status: 'Published' });

    // 5. Return result
    return NextResponse.json({ published: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 