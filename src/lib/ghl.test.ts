import { publishPost } from './ghl';
import { getPost } from './ghl';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock environment variables
process.env.GHL_API_KEY = 'test-api-key';
process.env.GHL_BLOG_ID = 'test-blog-id';

const server = setupServer(
  // Mock successful post creation
  http.post('https://app.marketsurge.io/v2/blogs/posts', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-post-id',
        url: 'https://example.com/blog/test-post',
      },
    });
  }),

  // Mock successful post retrieval
  http.get('https://app.marketsurge.io/v2/blogs/posts/:postId', () => {
    return new HttpResponse(null, { status: 200 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GHL Client', () => {
  describe('publishPost', () => {
    it('should successfully publish a post', async () => {
      const postData = {
        title: 'Test Post',
        html: '<p>Test content</p>',
        featuredImageUrl: 'https://example.com/image.jpg',
      };

      const result = await publishPost(postData);

      expect(result).toEqual({
        id: 'test-post-id',
        url: 'https://example.com/blog/test-post',
      });
    });

    it('should throw error when API returns error', async () => {
      server.use(
        http.post('https://app.marketsurge.io/v2/blogs/posts', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Invalid request',
                code: 'BAD_REQUEST',
              },
            },
            { status: 400 }
          );
        })
      );

      const postData = {
        title: 'Test Post',
        html: '<p>Test content</p>',
        featuredImageUrl: 'https://example.com/image.jpg',
      };

      await expect(publishPost(postData)).rejects.toThrow('Failed to publish post: Invalid request');
    });
  });

  describe('getPost', () => {
    it('should return true for existing post', async () => {
      const exists = await getPost('test-post-id');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing post', async () => {
      server.use(
        http.get('https://app.marketsurge.io/v2/blogs/posts/:postId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const exists = await getPost('non-existing-id');
      expect(exists).toBe(false);
    });
  });
}); 