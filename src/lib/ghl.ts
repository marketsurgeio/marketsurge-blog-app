import { logger } from './logger';

interface GHLPost {
  title: string;
  html: string;
  featuredImageUrl: string;
  status: 'Draft' | 'Published';
}

interface GHLResponse {
  id: string;
  url: string;
}

export class GHLError extends Error {
  constructor(message: string, public code: string, public details?: unknown) {
    super(message);
    this.name = 'GHLError';
  }
}

export const GHL_ERROR_CODES = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

async function handleGHLResponse(response: Response): Promise<unknown> {
  const data = await response.json();

  if (!response.ok) {
    const errorCode = response.status === 401 ? GHL_ERROR_CODES.AUTH_ERROR :
                     response.status === 404 ? GHL_ERROR_CODES.NOT_FOUND :
                     response.status === 429 ? GHL_ERROR_CODES.RATE_LIMIT :
                     response.status === 422 ? GHL_ERROR_CODES.VALIDATION_ERROR :
                     response.status >= 500 ? GHL_ERROR_CODES.SERVER_ERROR :
                     GHL_ERROR_CODES.SERVER_ERROR;

    throw new GHLError(
      data.message || 'GHL API request failed',
      errorCode,
      data
    );
  }

  return data;
}

export async function publishPost(post: GHLPost): Promise<GHLResponse> {
  try {
    const apiKey = process.env.GHL_API_KEY;
    const blogId = process.env.GHL_BLOG_ID;

    if (!apiKey || !blogId) {
      throw new GHLError(
        'GHL configuration is missing',
        GHL_ERROR_CODES.CONFIG_ERROR
      );
    }

    // Validate post data
    if (!post.title?.trim()) {
      throw new GHLError(
        'Post title is required',
        GHL_ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!post.html?.trim()) {
      throw new GHLError(
        'Post content is required',
        GHL_ERROR_CODES.VALIDATION_ERROR
      );
    }

    const response = await fetch(`https://rest.gohighlevel.com/v1/blogs/${blogId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: post.title,
        content: post.html,
        featuredImage: post.featuredImageUrl,
        status: post.status.toLowerCase(),
      }),
    });

    const data = await handleGHLResponse(response) as GHLResponse;

    logger.info('Published post to GHL', {
      postId: data.id,
      title: post.title,
    });

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error) {
    logger.error('Failed to publish to GHL', { error });

    if (error instanceof GHLError) {
      throw error;
    }

    throw new GHLError(
      'Failed to publish post to GHL',
      GHL_ERROR_CODES.SERVER_ERROR,
      error
    );
  }
}

export async function getBlogDetails(): Promise<{
  id: string;
  name: string;
  url: string;
}> {
  try {
    const apiKey = process.env.GHL_API_KEY;
    const blogId = process.env.GHL_BLOG_ID;

    if (!apiKey || !blogId) {
      throw new GHLError(
        'GHL configuration is missing',
        GHL_ERROR_CODES.CONFIG_ERROR
      );
    }

    const response = await fetch(`https://rest.gohighlevel.com/v1/blogs/${blogId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await handleGHLResponse(response) as { id: string; name: string; url: string };

    return {
      id: data.id,
      name: data.name,
      url: data.url,
    };
  } catch (error) {
    logger.error('Failed to get GHL blog details', { error });

    if (error instanceof GHLError) {
      throw error;
    }

    throw new GHLError(
      'Failed to get blog details from GHL',
      GHL_ERROR_CODES.SERVER_ERROR,
      error
    );
  }
}

// Helper function to check if a post exists
export async function getPost(postId: string): Promise<boolean> {
  const apiKey = process.env.GHL_API_KEY;
  
  if (!apiKey) {
    throw new Error('GHL_API_KEY environment variable is required');
  }

  const response = await fetch(
    `https://rest.gohighlevel.com/v1/blogs/posts/${postId}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  return response.ok;
}

interface GHLBlogPost {
  title: string;
  html: string;
  featuredImageUrl: string;
  status: 'Draft' | 'Published';
  blogId: string;
}

export class GHLClient {
  private static instance: GHLClient;
  private readonly apiKey: string;
  private readonly blogId: string;
  private readonly baseUrl = 'https://rest.gohighlevel.com/v1';

  private constructor() {
    const apiKey = process.env.GHL_API_KEY;
    const blogId = process.env.GHL_BLOG_ID;

    if (!apiKey || !blogId) {
      throw new GHLError(
        'GHL configuration is missing',
        GHL_ERROR_CODES.CONFIG_ERROR
      );
    }

    this.apiKey = apiKey;
    this.blogId = blogId;
  }

  static getInstance(): GHLClient {
    if (!GHLClient.instance) {
      GHLClient.instance = new GHLClient();
    }
    return GHLClient.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorCode = response.status === 401 ? GHL_ERROR_CODES.AUTH_ERROR :
                       response.status === 404 ? GHL_ERROR_CODES.NOT_FOUND :
                       response.status === 429 ? GHL_ERROR_CODES.RATE_LIMIT :
                       response.status === 422 ? GHL_ERROR_CODES.VALIDATION_ERROR :
                       response.status >= 500 ? GHL_ERROR_CODES.SERVER_ERROR :
                       GHL_ERROR_CODES.SERVER_ERROR;

      throw new GHLError(
        data.message || 'GHL API request failed',
        errorCode,
        data
      );
    }

    return data as T;
  }

  async publishBlogPost(post: Omit<GHLBlogPost, 'blogId'>): Promise<GHLResponse> {
    try {
      // Validate post data
      if (!post.title?.trim()) {
        throw new GHLError(
          'Post title is required',
          GHL_ERROR_CODES.VALIDATION_ERROR
        );
      }

      if (!post.html?.trim()) {
        throw new GHLError(
          'Post content is required',
          GHL_ERROR_CODES.VALIDATION_ERROR
        );
      }

      const response = await this.request<GHLResponse>(`/blogs/${this.blogId}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          title: post.title,
          content: post.html,
          featuredImage: post.featuredImageUrl,
          status: post.status.toLowerCase(),
        }),
      });

      logger.info('Published post to GHL', {
        postId: response.id,
        title: post.title,
      });

      return response;
    } catch (error) {
      logger.error('Failed to publish to GHL', { error });

      if (error instanceof GHLError) {
        throw error;
      }

      throw new GHLError(
        'Failed to publish post to GHL',
        GHL_ERROR_CODES.SERVER_ERROR,
        error
      );
    }
  }

  async getBlogDetails(): Promise<{
    id: string;
    name: string;
    url: string;
  }> {
    try {
      return await this.request<{ id: string; name: string; url: string }>(`/blogs/${this.blogId}`);
    } catch (error) {
      logger.error('Failed to get GHL blog details', { error });

      if (error instanceof GHLError) {
        throw error;
      }

      throw new GHLError(
        'Failed to get blog details from GHL',
        GHL_ERROR_CODES.SERVER_ERROR,
        error
      );
    }
  }

  async getBlogPost(postId: string): Promise<GHLBlogPost> {
    try {
      return await this.request<GHLBlogPost>(`/blogs/posts/${postId}`);
    } catch (error) {
      logger.error('Failed to get GHL blog post', { error });

      if (error instanceof GHLError) {
        throw error;
      }

      throw new GHLError(
        'Failed to get blog post from GHL',
        GHL_ERROR_CODES.SERVER_ERROR,
        error
      );
    }
  }

  async postExists(postId: string): Promise<boolean> {
    try {
      await this.request(`/blogs/posts/${postId}`);
      return true;
    } catch (error) {
      if (error instanceof GHLError && error.code === GHL_ERROR_CODES.NOT_FOUND) {
        return false;
      }
      throw error;
    }
  }
}

export const ghlClient = GHLClient.getInstance(); 