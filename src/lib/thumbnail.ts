// import { createCanvas, loadImage } from '@napi-rs/canvas';
import OpenAI from 'openai';
import { logger } from './logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ThumbnailOptions {
  title: string;
  industry: string;
  width?: number;
  height?: number;
}

export function getRandomGradient() {
  return {
    start: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    end: `#${Math.floor(Math.random()*16777215).toString(16)}`
  };
}

export async function generateThumbnail({
  title,
  industry,
  width = 1200,
  height = 628
}: ThumbnailOptions): Promise<Buffer> {
  try {
    // 1. Generate or fetch background image
    const backgroundImage = await getBackgroundImage(title, industry);

    // 2. Create canvas
    // const canvas = createCanvas(width, height);
    // const ctx = canvas.getContext('2d');

    // 3. Draw background
    // const img = await loadImage(backgroundImage);
    // ctx.drawImage(img, 0, 0, width, height);

    // 4. Add dark overlay for better text contrast
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    // ctx.fillRect(0, 0, width, height);

    // 5. Add title
    // ctx.font = 'bold 60px system-ui';
    // ctx.fillStyle = '#FFFFFF';
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';

    // Word wrap the title
    // const words = title.split(' ');
    // const lineHeight = 70;
    // const maxWidth = width * 0.8;
    // const lines: string[] = [];
    // let currentLine = words[0];

    // for (let i = 1; i < words.length; i++) {
    //   const word = words[i];
    //   const width = ctx.measureText(currentLine + ' ' + word).width;
    //   if (width < maxWidth) {
    //     currentLine += ' ' + word;
    //   } else {
    //     lines.push(currentLine);
    //     currentLine = word;
    //   }
    // }
    // lines.push(currentLine);

    // Draw wrapped text
    // const totalHeight = lines.length * lineHeight;
    // const startY = (height - totalHeight) / 2;
    // lines.forEach((line, i) => {
    //   ctx.fillText(line, width / 2, startY + (i * lineHeight));
    // });

    // 6. Add MarketSurge logo
    // const logoUrl = process.env.MARKETSURGE_LOGO_URL;
    // if (logoUrl) {
    //   const logo = await loadImage(logoUrl);
    //   const logoWidth = 200;
    //   const logoHeight = (logo.height * logoWidth) / logo.width;
    //   ctx.drawImage(logo, 40, 40, logoWidth, logoHeight);
    // }

    // 7. Export as buffer
    // return canvas.toBuffer('image/jpeg', 0.9);
    return Buffer.from('Placeholder thumbnail');
  } catch (error) {
    logger.error('Failed to generate thumbnail', { error, title, industry });
    throw error;
  }
}

async function getBackgroundImage(title: string, industry: string): Promise<string> {
  try {
    // Try DALL·E first
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional, abstract background image for a blog post about "${title}" in the ${industry} industry. The image should be suitable for text overlay and maintain a professional appearance.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    return response.data[0].url;
  } catch (error) {
    logger.warn('DALL·E image generation failed, falling back to Unsplash', { error });
    
    // Fallback to Unsplash
    const query = encodeURIComponent(`${industry} ${title.split(' ')[0]}`);
    return `https://source.unsplash.com/featured/?${query}`;
  }
} 