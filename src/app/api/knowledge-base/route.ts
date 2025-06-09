import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'data', 'knowledge-base.txt');

// Ensure the knowledge base file exists
async function ensureKnowledgeBaseExists() {
  try {
    await fs.access(KNOWLEDGE_BASE_PATH);
  } catch {
    // File doesn't exist, create it with default content
    await fs.writeFile(
      KNOWLEDGE_BASE_PATH,
      '# MarketSurge Knowledge Base\n\nAdd your knowledge base content here.',
      'utf-8'
    );
  }
}

export async function GET() {
  try {
    await ensureKnowledgeBaseExists();
    const content = await fs.readFile(KNOWLEDGE_BASE_PATH, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    logger.error('Failed to fetch knowledge base', { error });
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await ensureKnowledgeBaseExists();
    await fs.writeFile(KNOWLEDGE_BASE_PATH, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to update knowledge base', { error });
    return NextResponse.json(
      { error: 'Failed to update knowledge base' },
      { status: 500 }
    );
  }
} 