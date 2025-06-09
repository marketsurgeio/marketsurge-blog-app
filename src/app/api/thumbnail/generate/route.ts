import { NextResponse } from 'next/server';
import { createCanvas } from '@napi-rs/canvas';
import { auth } from '@clerk/nextjs/server';
import { checkAndUpdateUsage } from '@/lib/costGuard';
import { logger } from '@/lib/logger';

interface ThumbnailOptions {
  title: string;
  industry: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  overlayOpacity: number;
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage before proceeding (estimate 1000 tokens for DALL·E)
    const canProceed = await checkAndUpdateUsage(session.userId, 1000);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Daily budget exceeded' },
        { status: 429 }
      );
    }

    const options: ThumbnailOptions = await request.json();
    if (!options.title || !options.industry) {
      return NextResponse.json(
        { error: 'Title and industry are required' },
        { status: 400 }
      );
    }

    // Create canvas
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${options.overlayOpacity * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${options.overlayOpacity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = options.textColor;
    ctx.font = `bold ${options.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap function
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Draw wrapped title
    const maxWidth = width * 0.8;
    const lines = wrapText(options.title, maxWidth);
    const lineHeight = options.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2;

    lines.forEach((line, i) => {
      const y = startY + (i * lineHeight);
      ctx.fillText(line, width / 2, y);
    });

    // Draw industry tag
    ctx.font = '24px sans-serif';
    ctx.fillStyle = options.textColor;
    ctx.textAlign = 'center';
    ctx.fillText(options.industry, width / 2, height - 50);

    // Convert to JPEG buffer
    const buffer = await canvas.encode('jpeg', 90);

    // Log success
    logger.info('Thumbnail generated successfully', {
      userId: session.userId,
      title: options.title,
      industry: options.industry,
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    logger.error('Failed to generate thumbnail', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
} 