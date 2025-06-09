import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getArticle } from '@/lib/storage';

// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
const articleStorage = new Map<string, any>();

function formatHtml(content: string): string {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  // Format each paragraph
  const formattedParagraphs = paragraphs.map(p => {
    // Check if it's a heading
    if (p.startsWith('# ')) {
      return `<h1>${p.slice(2)}</h1>`;
    }
    if (p.startsWith('## ')) {
      return `<h2>${p.slice(3)}</h2>`;
    }
    if (p.startsWith('### ')) {
      return `<h3>${p.slice(4)}</h3>`;
    }
    // Regular paragraph
    return `<p>${p}</p>`;
  });

  // Join paragraphs with newlines for readability
  return formattedParagraphs.join('\n');
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Preview API: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Preview API: Fetching article for user:', userId);

    // Get the article data from storage
    const articleData = await getArticle(userId);
    if (!articleData) {
      console.error('Preview API: No article found for user:', userId);
      return NextResponse.json(
        { error: 'No article found' },
        { status: 404 }
      );
    }

    // Format the response with all necessary data
    const response = {
      title: articleData.title,
      content: articleData.content,
      html: formatHtml(articleData.content),
      industry: articleData.industry,
      keywords: articleData.keywords || [],
      youtubeUrl: articleData.youtubeUrl || null,
      createdAt: articleData.createdAt,
      status: articleData.status || 'draft'
    };

    console.log('Preview API: Found article data:', response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Preview API: Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview data', details: error.message },
      { status: 500 }
    );
  }
} 