import { NextResponse } from 'next/server';
import { GHLClient } from '@/lib/ghl';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const client = GHLClient.getInstance();
    logger.info('GHL Client initialized');
    
    // Check if environment variables are set
    if (!process.env.GHL_PRIVATE_INTEGRATION_TOKEN || !process.env.GHL_BLOG_ID || !process.env.GHL_LOCATION_ID) {
      logger.error('Missing GHL environment variables', {
        hasPrivateIntegrationToken: !!process.env.GHL_PRIVATE_INTEGRATION_TOKEN,
        hasBlogId: !!process.env.GHL_BLOG_ID,
        hasLocationId: !!process.env.GHL_LOCATION_ID
      });
      return NextResponse.json(
        { success: false, error: 'Missing GHL configuration' },
        { status: 500 }
      );
    }

    const blogDetails = await client.getBlogDetails();
    logger.info('Blog details fetched successfully', { blogDetails });
    
    return NextResponse.json({ success: true, data: blogDetails });
  } catch (error: unknown) {
    logger.error('GHL test endpoint error:', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 