import { NextResponse } from 'next/server';
import { checkAndUpdateUsage } from '@/lib/costGuard';
import { generateThumbnail } from '@/lib/thumbnail';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

// Mark this route as server-side only
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check usage before proceeding (estimate 1000 tokens for DALL·E)
    const canProceed = await checkAndUpdateUsage(session.userId, 1000);
    if (!canProceed) {
      return new NextResponse('Daily budget exceeded', { status: 429 });
    }

    const { title, industry } = await request.json();

    if (!title || !industry) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail({ title, industry });

    // Convert buffer to base64
    const base64Image = thumbnailBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    logger.info('Generated thumbnail', { title, industry });

    return NextResponse.json({ thumbnailUrl: dataUrl });
  } catch (error) {
    logger.error('Failed to generate thumbnail', { error });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 