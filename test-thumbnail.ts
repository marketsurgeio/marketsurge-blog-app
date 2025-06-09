import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';

async function testThumbnail() {
  const response = await fetch('http://localhost:3004/api/thumbnail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'AI in Marketing' })
  });

  if (!response.ok) {
    console.error('Failed to generate thumbnail:', await response.text());
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile('thumbnail.png', buffer);
  console.log('Thumbnail saved as thumbnail.png');
}

testThumbnail(); 