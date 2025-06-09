import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ghlClient, GHLError, GHL_ERROR_CODES } from '@/lib/ghl';
import { costGuard } from '@/lib/costGuard';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.userId || 'anonymous';

    const { title, content, industry, keywords, youtubeUrl } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check usage limit only for authenticated users
    if (session?.userId) {
      const estimatedTokens = Math.ceil(content.length / 4); // Rough estimate
      const canProceed = await costGuard.checkUsageLimit(session.userId, estimatedTokens);
      if (!canProceed) {
        return NextResponse.json(
          { error: 'Daily usage limit exceeded' },
          { status: 429 }
        );
      }
    }

    // Publish to GHL
    try {
      const response = await ghlClient.publishBlogPost({
        title,
        html: content,
        status: 'Published',
        featuredImageUrl: '' // Required by GHL interface but not used
      });

      logger.info('Successfully published post', {
        userId,
        postId: response.id,
        title,
        industry
      });

      // Store in Firestore
      await adminDb.collection('posts').doc(response.id).set({
        userId,
        title,
        content,
        industry,
        keywords: keywords || [],
        youtubeUrl: youtubeUrl || null,
        url: response.url,
        status: 'Published',
        publishedAt: new Date().toISOString(),
        ghlPostId: response.id,
      });

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof GHLError) {
        switch (error.code) {
          case GHL_ERROR_CODES.AUTH_ERROR:
            return NextResponse.json(
              { error: 'GHL authentication failed' },
              { status: 401 }
            );
          case GHL_ERROR_CODES.RATE_LIMIT:
            return NextResponse.json(
              { error: 'GHL rate limit exceeded' },
              { status: 429 }
            );
          case GHL_ERROR_CODES.VALIDATION_ERROR:
            return NextResponse.json(
              { error: error.message },
              { status: 400 }
            );
          case GHL_ERROR_CODES.SERVER_ERROR:
            return NextResponse.json(
              { error: 'GHL service unavailable' },
              { status: 503 }
            );
          default:
            return NextResponse.json(
              { error: 'Failed to publish post' },
              { status: 500 }
            );
        }
      }

      throw error;
    }
  } catch (error) {
    logger.error('Error in publish endpoint', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 