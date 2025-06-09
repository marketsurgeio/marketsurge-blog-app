import { logger } from './logger';

interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string;
}

interface WordPressPost {
  title: string;
  content: string;
  status: 'draft' | 'publish';
  categories: number[];
  featured_media?: number;
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export class WordPressError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'WordPressError';
  }
}

export async function getWordPressCategories(config: WordPressConfig): Promise<WordPressCategory[]> {
  try {
    // Get authentication token
    const authResponse = await fetch(`${config.siteUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!authResponse.ok) {
      throw new WordPressError('Authentication failed', 'AUTH_ERROR');
    }

    const { token } = await authResponse.json();

    // Get categories
    const categoriesResponse = await fetch(`${config.siteUrl}/wp-json/wp/v2/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!categoriesResponse.ok) {
      throw new WordPressError('Failed to fetch categories', 'CATEGORIES_FETCH_ERROR');
    }

    const categories = await categoriesResponse.json();
    return categories;
  } catch (error) {
    logger.error('Failed to get WordPress categories', { error });
    throw error;
  }
}

export async function validateCategoryId(config: WordPressConfig, categoryId: number): Promise<boolean> {
  try {
    const categories = await getWordPressCategories(config);
    return categories.some(category => category.id === categoryId);
  } catch (error) {
    logger.error('Failed to validate category ID', { error, categoryId });
    throw error;
  }
}

export async function publishToWordPress(
  config: WordPressConfig,
  post: WordPressPost
): Promise<{ postId: number; postUrl: string }> {
  try {
    // First, get the authentication token
    const authResponse = await fetch(`${config.siteUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!authResponse.ok) {
      throw new WordPressError('Authentication failed', 'AUTH_ERROR');
    }

    const { token } = await authResponse.json();

    // Create the post
    const postResponse = await fetch(`${config.siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(post),
    });

    if (!postResponse.ok) {
      const error = await postResponse.json();
      throw new WordPressError(
        error.message || 'Failed to create post',
        'POST_CREATION_ERROR'
      );
    }

    const createdPost = await postResponse.json();

    logger.info('Published post to WordPress', {
      postId: createdPost.id,
      title: post.title,
    });

    return {
      postId: createdPost.id,
      postUrl: createdPost.link,
    };
  } catch (error) {
    logger.error('Failed to publish to WordPress', { error });
    throw error;
  }
}

export async function uploadMediaToWordPress(
  config: WordPressConfig,
  imageBuffer: Buffer,
  fileName: string
): Promise<number> {
  try {
    // Get authentication token
    const authResponse = await fetch(`${config.siteUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!authResponse.ok) {
      throw new WordPressError('Authentication failed', 'AUTH_ERROR');
    }

    const { token } = await authResponse.json();

    // Create form data for the image
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer]), fileName);

    // Upload the image
    const uploadResponse = await fetch(`${config.siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new WordPressError(
        error.message || 'Failed to upload media',
        'MEDIA_UPLOAD_ERROR'
      );
    }

    const uploadedMedia = await uploadResponse.json();

    logger.info('Uploaded media to WordPress', {
      mediaId: uploadedMedia.id,
      fileName,
    });

    return uploadedMedia.id;
  } catch (error) {
    logger.error('Failed to upload media to WordPress', { error });
    throw error;
  }
} 