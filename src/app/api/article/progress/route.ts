import { NextResponse } from 'next/server';
import { getCurrentProgress } from '@/lib/progress';

export function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial progress immediately
      const data = `data: ${JSON.stringify(getCurrentProgress())}\n\n`;
      controller.enqueue(encoder.encode(data));

      const interval = setInterval(() => {
        try {
          const data = `data: ${JSON.stringify(getCurrentProgress())}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error sending progress update:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Clean up interval when the client disconnects
      return () => {
        clearInterval(interval);
        controller.close();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
} 