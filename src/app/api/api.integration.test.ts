import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { checkAndUpdateUsage } from '@/lib/costGuard';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
}));

// Mock cost guard
jest.mock('@/lib/costGuard', () => ({
  checkAndUpdateUsage: jest.fn(),
}));

// Mock OpenAI and other libs as needed
jest.mock('@/lib/openai', () => ({
  getIdeas: jest.fn().mockResolvedValue({ titles: ['Idea 1', 'Idea 2', 'Idea 3'] }),
  getArticle: jest.fn().mockResolvedValue({ html: '<p>Test Article</p>' }),
}));

jest.mock('@/lib/thumbnail', () => ({
  generateThumbnail: jest.fn().mockResolvedValue(Buffer.from('test', 'utf-8')),
}));

jest.mock('@/lib/ghl', () => ({
  publishPost: jest.fn().mockResolvedValue({ id: '123', url: 'https://example.com/post/123' }),
}));

describe('API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockImplementation(() => ({ userId: 'test-user' }));
    (checkAndUpdateUsage as jest.Mock).mockResolvedValue({ allowed: true });
  });

  describe('/api/ideas', () => {
    it('returns ideas for authenticated user', async () => {
      const { POST } = await import('./ideas');
      const req = new NextRequest('http://localhost:3004/api/ideas', {
        method: 'POST',
        body: JSON.stringify({ topic: 'test topic', industry: 'test industry' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('ideas');
    });

    it('returns 401 for unauthenticated user', async () => {
      (getAuth as jest.Mock).mockImplementation(() => ({ userId: null }));
      const { POST } = await import('./ideas');
      const req = new NextRequest('http://localhost:3004/api/ideas', {
        method: 'POST',
        body: JSON.stringify({ topic: 'test topic', industry: 'test industry' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('/api/article', () => {
    it('returns article for authenticated user', async () => {
      const { POST } = await import('./article');
      const req = new NextRequest('http://localhost:3004/api/article', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', keywords: ['test keyword'], industry: 'test industry' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('article');
    });

    it('returns 401 for unauthenticated user', async () => {
      (getAuth as jest.Mock).mockImplementation(() => ({ userId: null }));
      const { POST } = await import('./article');
      const req = new NextRequest('http://localhost:3004/api/article', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', keywords: ['test keyword'], industry: 'test industry' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('/api/thumbnail', () => {
    it('returns thumbnail for authenticated user', async () => {
      const { POST } = await import('./thumbnail');
      const req = new NextRequest('http://localhost:3004/api/thumbnail', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', backgroundGradient: { start: '#fff', end: '#000' } }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('thumbnail');
    });

    it('returns 401 for unauthenticated user', async () => {
      (getAuth as jest.Mock).mockImplementation(() => ({ userId: null }));
      const { POST } = await import('./thumbnail');
      const req = new NextRequest('http://localhost:3004/api/thumbnail', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', backgroundGradient: { start: '#fff', end: '#000' } }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('/api/publish', () => {
    it('returns published result for authenticated user', async () => {
      const { POST } = await import('./publish');
      const req = new NextRequest('http://localhost:3004/api/publish', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', html: '<p>test</p>', featuredImageUrl: 'https://example.com/img.png' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('published');
    });

    it('returns 401 for unauthenticated user', async () => {
      (getAuth as jest.Mock).mockImplementation(() => ({ userId: null }));
      const { POST } = await import('./publish');
      const req = new NextRequest('http://localhost:3004/api/publish', {
        method: 'POST',
        body: JSON.stringify({ title: 'test title', html: '<p>test</p>', featuredImageUrl: 'https://example.com/img.png' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });
}); 