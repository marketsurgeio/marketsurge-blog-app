import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { generateThumbnail } from '@/lib/thumbnail';
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
    const { title, industry } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    // 3. Cost guard check (optional, e.g., 100 tokens)
    const estimatedTokens = 100;
    const canProceed = await costGuard.checkUsageLimit(userId, estimatedTokens);
    if (!canProceed) {
      return NextResponse.json({ error: 'Budget exceeded' }, { status: 403 });
    }

    // 4. Generate thumbnail
    const buffer = await generateThumbnail({ title, industry });
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // 5. Return image as base64 data URL
    return NextResponse.json({ thumbnail: dataUrl });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 