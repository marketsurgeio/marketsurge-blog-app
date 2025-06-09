import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAndUpdateUsage } from '@/lib/costGuard';
import { publishPost, GHLError } from '@/lib/ghl';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage before proceeding (estimate 500 tokens for publishing)
    const canProceed = await checkAndUpdateUsage(session.userId, 500);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Daily budget exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    logger.info('Received publish request body:', { 
      hasTitle: !!body.title,
      hasContent: !!body.content,
      hasThumbnail: !!body.thumbnailUrl,
      hasIndustry: !!body.industry,
      contentLength: body.content?.length
    });

    const { title, content, thumbnailUrl, industry } = body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!content) missingFields.push('content');
    if (!thumbnailUrl) missingFields.push('thumbnailUrl');
    if (!industry) missingFields.push('industry');

    if (missingFields.length > 0) {
      logger.error('Missing required fields', { missingFields });
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate field types
    if (typeof title !== 'string') {
      return NextResponse.json({ error: 'Title must be a string' }, { status: 400 });
    }
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }
    if (typeof thumbnailUrl !== 'string') {
      return NextResponse.json({ error: 'Thumbnail URL must be a string' }, { status: 400 });
    }
    if (typeof industry !== 'string') {
      return NextResponse.json({ error: 'Industry must be a string' }, { status: 400 });
    }

    // Publish to GHL
    const ghlResult = await publishPost({
      title,
      html: content,
      featuredImageUrl: thumbnailUrl,
      status: 'Published'
    });
    
    logger.info('Successfully published to GHL', { ghlId: ghlResult?.id });

    return NextResponse.json({
      ghl: {
        id: ghlResult.id,
        url: ghlResult.url,
      }
    });
  } catch (error) {
    logger.error('Failed to publish blog post', { error });

    if (error instanceof GHLError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'CONFIG_ERROR' ? 500 : 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    );
  }
} 