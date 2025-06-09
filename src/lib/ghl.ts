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

const GHL_ERROR_CODES = {
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