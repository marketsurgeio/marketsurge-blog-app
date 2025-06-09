import { NextRequest, NextResponse } from 'next/server';
import { getPostById } from '@/lib/firestore';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await getPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    logger.error('Failed to fetch post', { error, postId: id });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 