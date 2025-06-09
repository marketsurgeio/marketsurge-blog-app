import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
const articleStorage = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Preview API: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Preview API: Fetching article for user:', userId);
    console.log('Current storage state:', Array.from(articleStorage.entries()));

    // Get the article data from storage
    const articleData = articleStorage.get(userId);
    if (!articleData) {
      console.error('Preview API: No article found for user:', userId);
      return NextResponse.json(
        { error: 'No article found' },
        { status: 404 }
      );
    }

    console.log('Preview API: Found article data:', articleData);
    return NextResponse.json(articleData);
  } catch (error: any) {
    console.error('Preview API: Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview data', details: error.message },
      { status: 500 }
    );
  }
} 