import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GHLError } from '@/lib/ghl';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GHL_API_KEY;
    const blogId = process.env.GHL_BLOG_ID;

    if (!apiKey || !blogId) {
      throw new GHLError('GHL configuration is missing', 'CONFIG_ERROR');
    }

    // Test the connection by fetching blog details
    const response = await fetch(`https://rest.gohighlevel.com/v1/blogs/${blogId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new GHLError(
        error.message || 'Failed to connect to GHL',
        'CONNECTION_ERROR'
      );
    }

    const data = await response.json();

    logger.info('GHL connection test successful', {
      blogId,
      blogName: data.name,
    });

    return NextResponse.json({
      success: true,
      blog: {
        id: data.id,
        name: data.name,
        url: data.url,
      },
    });
  } catch (error) {
    logger.error('GHL connection test failed', { error });

    if (error instanceof GHLError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'CONFIG_ERROR' ? 500 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test GHL connection' },
      { status: 500 }
    );
  }
} 