import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { GHLClient } from '@/lib/ghl';

export async function POST() {
  try {
    logger.info('GHL Client initialized');
    const client = new GHLClient();

    // Check for required environment variables
    if (!process.env.GHL_PRIVATE_INTEGRATION_TOKEN || !process.env.GHL_LOCATION_ID || !process.env.GHL_BLOG_ID) {
      logger.error('Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    // Create a test blog post
    const testPost = {
      title: 'Test Blog Post',
      content: '<p>This is a test blog post created via the API.</p>',
      featuredImage: 'https://example.com/test-image.jpg',
      status: 'published' as const,
      slug: 'test-blog-post',
    };

    logger.info('Attempting to create test blog post', { post: testPost });

    // Create the blog post using the GHL client
    const response = await client.createBlogPost(process.env.GHL_BLOG_ID!, testPost);

    logger.info('Successfully created test blog post', { response });
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error('Failed to create test blog post', { error });
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
} 