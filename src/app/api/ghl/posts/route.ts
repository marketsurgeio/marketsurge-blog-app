import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { GHLClient } from '@/lib/ghl';

export async function POST(request: Request) {
  try {
    logger.info('GHL Client initialized');
    const client = GHLClient.getInstance();

    // Check for required environment variables
    if (!process.env.GHL_PRIVATE_INTEGRATION_TOKEN || !process.env.GHL_LOCATION_ID || !process.env.GHL_BLOG_ID) {
      logger.error('Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content, featuredImageUrl, slug } = body;

    // Validate required fields
    if (!title || !content) {
      logger.error('Missing required fields', { body });
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create blog post using GHL client
    const response = await client.createBlogPost(process.env.GHL_BLOG_ID, {
      title,
      content,
      featuredImage: featuredImageUrl,
      status: 'published',
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });

    logger.info('Successfully created blog post', { response });
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error('Failed to create blog post', { error });
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
} 