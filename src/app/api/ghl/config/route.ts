import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GHL_API_KEY;
    const blogId = process.env.GHL_BLOG_ID;

    logger.info('Checking GHL configuration', {
      hasApiKey: !!apiKey,
      hasBlogId: !!blogId,
      apiKeyLength: apiKey?.length,
      blogIdLength: blogId?.length
    });

    if (!apiKey || !blogId) {
      return NextResponse.json({
        error: 'GHL configuration is missing',
        details: {
          hasApiKey: !!apiKey,
          hasBlogId: !!blogId
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: {
        hasApiKey: true,
        hasBlogId: true,
        apiKeyLength: apiKey.length,
        blogIdLength: blogId.length
      }
    });
  } catch (error) {
    logger.error('Failed to check GHL configuration', { error });
    return NextResponse.json(
      { error: 'Failed to check GHL configuration' },
      { status: 500 }
    );
  }
} 