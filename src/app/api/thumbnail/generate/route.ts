import { NextResponse } from 'next/server';
// import { createCanvas } from '@napi-rs/canvas';
import { auth } from '@clerk/nextjs/server';
// import { checkAndUpdateUsage } from '@/lib/costGuard';
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

export async function POST(req: Request) {
  // const session = await auth();
  // if (!session?.userId) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // const { title, subtitle } = await req.json();
  // if (!title) {
  //   return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  // }

  // // Check usage limit
  // const canProceed = await checkAndUpdateUsage(session.userId);
  // if (!canProceed) {
  //   return NextResponse.json({ error: 'Daily usage limit exceeded' }, { status: 429 });
  // }

  // try {
  //   const width = 1200;
  //   const height = 628;
  //   // const canvas = createCanvas(width, height);
  //   // const ctx = canvas.getContext('2d');

  //   // // Fill background
  //   // ctx.fillStyle = '#1a1a1a';
  //   // ctx.fillRect(0, 0, width, height);

  //   // // Add gradient overlay
  //   // const gradient = ctx.createLinearGradient(0, 0, 0, height);
  //   // gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  //   // gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  //   // ctx.fillStyle = gradient;
  //   // ctx.fillRect(0, 0, width, height);

  //   // // Add title
  //   // ctx.font = 'bold 64px Arial';
  //   // ctx.fillStyle = '#ffffff';
  //   // ctx.textAlign = 'center';
  //   // ctx.fillText(title, width / 2, height / 2);

  //   // if (subtitle) {
  //   //   ctx.font = '32px Arial';
  //   //   ctx.fillText(subtitle, width / 2, height / 2 + 80);
  //   // }

  //   // // Convert to buffer
  //   // const buffer = await canvas.toBuffer('image/png');

  //   // // Upload to S3
  //   // const s3Client = new S3Client({
  //   //   region: process.env.AWS_REGION!,
  //   //   credentials: {
  //   //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //   //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  //   //   },
  //   // });

  //   // const key = `thumbnails/${session.userId}/${Date.now()}.png`;
  //   // await s3Client.send(
  //   //   new PutObjectCommand({
  //   //     Bucket: process.env.AWS_S3_BUCKET!,
  //   //     Key: key,
  //   //     Body: buffer,
  //   //     ContentType: 'image/png',
  //   //   })
  //   // );

  //   // const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  //   return NextResponse.json({ url: 'https://example.com/placeholder.png' });
  // } catch (error) {
  //   console.error('Error generating thumbnail:', error);
  //   return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });
  // }

  return NextResponse.json({ url: 'https://example.com/placeholder.png' });
} 