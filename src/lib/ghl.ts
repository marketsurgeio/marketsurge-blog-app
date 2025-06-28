import { logger } from './logger';

interface GHLPost {
  id: string;
  title: string;
  html: string;
  featuredImageUrl: string;
  status: 'Draft' | 'Published';
  slug?: string;
  authorId?: string;
  categoryIds?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface GHLValidationError {
  field: string;
  message: string;
  code?: string;
}

interface GHLBadRequestError {
  message: string;
  code: string;
  errors?: GHLValidationError[];
  details?: Record<string, any>;
}

interface GHLUnauthorizedError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

interface GHLUnprocessableError {
  message: string;
  code: string;
  errors: GHLValidationError[];
  details?: Record<string, any>;
}

interface GHLSlugCheckResponse {
  success: boolean;
  available: boolean;
  suggestedSlug?: string;
}

interface GHLResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface GHLBlogCreateData {
  id: string;
  url: string;
}

interface GHLBlogPostCreateData {
  id: string;
  title: string;
  content: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  slug: string;
  authorId?: string;
  categoryIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

interface GHLBlogPostListData {
  posts: GHLPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface GHLBlogDetailsResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
    name: string;
    url: string;
  };
}

export class GHLError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
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
  REQUEST_FAILED: 'REQUEST_FAILED'
} as const;

// Error DTOs
interface GHLBadRequestDTO {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

interface GHLUnauthorizedDTO {
  success: false;
  error: {
    message: string;
    code: 'UNAUTHORIZED';
  };
}

interface GHLUnprocessableDTO {
  success: false;
  error: {
    message: string;
    code: 'VALIDATION_ERROR';
    details: {
      field: string;
      message: string;
      code: string;
    }[];
  };
}

// Blog Post DTOs
interface GHLBlogPostResponseDTO {
  id: string;
  title: string;
  content: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  slug: string;
  authorId?: string;
  categoryIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface GHLBlogPostCreateParams {
  title: string;
  content: string;
  featuredImage?: string;
  status?: 'draft' | 'published';
  slug?: string;
  authorId?: string;
  categoryIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  tags?: string[];
  publishedAt?: string;
}

interface GHLBlogPostUpdateParams {
  title?: string;
  content?: string;
  featuredImage?: string;
  status?: 'draft' | 'published';
  slug?: string;
  authorId?: string;
  categoryIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  tags?: string[];
  publishedAt?: string;
}

// Response Wrapper DTOs
interface GHLResponseWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
}

type GHLPost = GHLBlogPostResponseDTO;
type GHLBlogPostCreate = GHLBlogPostCreateParams;
type GHLBlogPostUpdate = GHLBlogPostUpdateParams;
type GHLResponse<T> = GHLResponseWrapper<T>;

async function handleGHLResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let data: unknown;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/xml') || contentType?.includes('application/xml')) {
    const text = await response.text();
    // Parse XML error response
    const errorMatch = text.match(/<Message>(.*?)<\/Message>/);
    const codeMatch = text.match(/<Code>(.*?)<\/Code>/);
    data = {
      error: {
        message: errorMatch ? errorMatch[1] : 'Unknown error',
        code: codeMatch ? codeMatch[1] : 'UNKNOWN_ERROR'
      }
    };
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { text };
    }
  }

  if (!response.ok) {
    const errorData = data as any;
    const errorMessage = errorData?.error?.message || 
                        errorData?.message || 
                        'An error occurred while communicating with the GHL API';
    const errorCode = errorData?.error?.code || 
                     errorData?.code || 
                     'UNKNOWN_ERROR';
    
    throw new GHLError(
      errorMessage,
      errorCode,
      {
        status: response.status,
        error: errorData
      }
    );
  }

  return data as T;
}

export async function publishPost(post: GHLPost): Promise<GHLResponse<GHLPost>> {
  if (!this.apiKey || !this.blogId) {
    throw new GHLError(
      'GHL configuration is missing',
      GHL_ERROR_CODES.CONFIG_ERROR
    );
  }

  // Validate post data
  this.validatePostData(post);

  try {
    const response = await fetch(
      `${this.baseUrl}/locations/${this.locationId}/blogs/${this.blogId}/posts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          blogId: this.blogId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new GHLError(
        'Failed to publish post',
        GHL_ERROR_CODES.REQUEST_FAILED,
        {
          status: response.status,
          error,
        }
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GHLError) {
      throw error;
    }
    throw new GHLError(
      'Failed to publish post',
      GHL_ERROR_CODES.REQUEST_FAILED,
      {
        error,
      }
    );
  }
}

export class GHLClient {
  private baseUrl: string;
  private token: string;
  private locationId: string;
  private blogId: string;

  constructor() {
    this.baseUrl = 'https://services.leadconnectorhq.com';
    this.token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '';
    this.locationId = process.env.GHL_LOCATION_ID || '';
    this.blogId = process.env.GHL_BLOG_ID || '';

    if (!this.token || !this.locationId || !this.blogId) {
      throw new Error('Missing required environment variables');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<GHLResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': this.token,
      'Version': '2021-07-28',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GHLError(
          errorData.message || 'An error occurred while communicating with the GHL API',
          'UNKNOWN_ERROR',
          {
            status: response.status,
            error: errorData
          }
        );
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T
      };
    } catch (error) {
      logger.error('GHL API request failed', { error, url, endpoint });
      throw error;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async checkSlugAvailability(slug: string): Promise<GHLSlugCheckResponse> {
    try {
      const response = await this.request<GHLSlugCheckResponse>('/check-slug', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to check slug availability',
          'CHECK_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to check slug availability', { error, slug });
      throw error;
    }
  }

  async getAuthors(): Promise<GHLAuthor[]> {
    try {
      const response = await this.request<GHLAuthor[]>('/authors');
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch authors',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch authors', { error });
      throw error;
    }
  }

  async getAuthor(authorId: string): Promise<GHLAuthor> {
    try {
      const response = await this.request<GHLAuthor>(`/authors/${authorId}`);
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch author',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch author', { error, authorId });
      throw error;
    }
  }

  async getCategories(): Promise<GHLCategory[]> {
    try {
      const response = await this.request<GHLCategory[]>('/categories');
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch categories',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch categories', { error });
      throw error;
    }
  }

  async getCategory(categoryId: string): Promise<GHLCategory> {
    try {
      const response = await this.request<GHLCategory>(`/categories/${categoryId}`);
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch category',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch category', { error, categoryId });
      throw error;
    }
  }

  private validateCategoryName(name: string): boolean {
    return name.length > 0 && name.length <= 100;
  }

  private validateCategoryDescription(description?: string): boolean {
    if (!description) return true;
    return description.length <= 500;
  }

  private validateCategoryCreate(category: GHLCategoryCreate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate name
    if (!this.validateCategoryName(category.name)) {
      errors.push({
        field: 'name',
        message: 'Category name must be between 1 and 100 characters'
      });
    }

    // Validate description if provided
    if (!this.validateCategoryDescription(category.description)) {
      errors.push({
        field: 'description',
        message: 'Category description must be less than 500 characters'
      });
    }

    // Validate parentId if provided
    if (category.parentId) {
      if (category.parentId.trim().length === 0) {
        errors.push({
          field: 'parentId',
          message: 'Parent category ID cannot be empty'
        });
      }
    }

    return errors;
  }

  private validateCategoryUpdate(category: GHLCategoryUpdate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate ID
    if (!category.id || category.id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'Category ID is required'
      });
    }

    // Validate name if provided
    if (category.name !== undefined && !this.validateCategoryName(category.name)) {
      errors.push({
        field: 'name',
        message: 'Category name must be between 1 and 100 characters'
      });
    }

    // Validate description if provided
    if (category.description !== undefined && !this.validateCategoryDescription(category.description)) {
      errors.push({
        field: 'description',
        message: 'Category description must be less than 500 characters'
      });
    }

    // Validate parentId if provided
    if (category.parentId !== undefined) {
      if (category.parentId.trim().length === 0) {
        errors.push({
          field: 'parentId',
          message: 'Parent category ID cannot be empty'
        });
      }
    }

    return errors;
  }

  async createCategory(category: GHLCategoryCreate): Promise<GHLCategory> {
    try {
      const validationErrors = this.validateCategoryCreate(category);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Category validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      const response = await this.request<GHLCategory>('/categories', {
        method: 'POST',
        body: JSON.stringify(category),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to create category',
          'CREATE_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to create category', { error, category });
      throw error;
    }
  }

  async updateCategory(category: GHLCategoryUpdate): Promise<GHLCategory> {
    try {
      const validationErrors = this.validateCategoryUpdate(category);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Category validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      const response = await this.request<GHLCategory>(`/categories/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify(category),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to update category',
          'UPDATE_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to update category', { error, category });
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await this.request(
        `/categories/${categoryId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Failed to delete category', { error, categoryId });
      throw error;
    }
  }

  private validatePostCreate(post: GHLBlogPostCreate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate required fields
    if (!post.title) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      errors.push(...this.validateFieldLength('title', post.title, 1, 200));
    }

    if (!post.content) {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      errors.push(...this.validateFieldLength('content', post.content, 1, 50000));
    }

    // Validate optional fields
    if (post.status && !['draft', 'published'].includes(post.status)) {
      errors.push({
        field: 'status',
        message: 'Status must be either draft or published',
        code: 'INVALID_STATUS'
      });
    }

    if (post.featuredImage) {
      errors.push(...this.validateFieldPattern(
        'featuredImage',
        post.featuredImage,
        /^https?:\/\/.+/,
        'Featured image URL must be a valid HTTP(S) URL'
      ));
    }

    if (post.authorId) {
      errors.push(...this.validateFieldPattern(
        'authorId',
        post.authorId,
        /^[a-zA-Z0-9-_]+$/,
        'Author ID must contain only letters, numbers, hyphens, and underscores'
      ));
    }

    if (post.categoryIds) {
      if (!Array.isArray(post.categoryIds)) {
        errors.push({
          field: 'categoryIds',
          message: 'Category IDs must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidCategoryIds = post.categoryIds.filter(id => 
          !id || typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)
        );
        if (invalidCategoryIds.length > 0) {
          errors.push({
            field: 'categoryIds',
            message: 'All category IDs must be valid strings containing only letters, numbers, hyphens, and underscores',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    if (post.metaTitle) {
      errors.push(...this.validateFieldLength('metaTitle', post.metaTitle, 0, 100));
    }

    if (post.metaDescription) {
      errors.push(...this.validateFieldLength('metaDescription', post.metaDescription, 0, 200));
    }

    if (post.metaKeywords) {
      if (!Array.isArray(post.metaKeywords)) {
        errors.push({
          field: 'metaKeywords',
          message: 'Meta keywords must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidKeywords = post.metaKeywords.filter(keyword => 
          !keyword || typeof keyword !== 'string' || keyword.length > 50
        );
        if (invalidKeywords.length > 0) {
          errors.push({
            field: 'metaKeywords',
            message: 'All meta keywords must be non-empty strings with maximum length of 50 characters',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    if (post.publishedAt) {
      const date = new Date(post.publishedAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'publishedAt',
          message: 'Published date must be a valid ISO 8601 date string',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (post.tags) {
      if (!Array.isArray(post.tags)) {
        errors.push({
          field: 'tags',
          message: 'Tags must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidTags = post.tags.filter(tag => 
          !tag || typeof tag !== 'string' || tag.length > 50
        );
        if (invalidTags.length > 0) {
          errors.push({
            field: 'tags',
            message: 'All tags must be non-empty strings with maximum length of 50 characters',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    return errors;
  }

  async createBlogPost(blogId: string, post: GHLBlogPostCreate): Promise<GHLPost> {
    try {
      // Validate post data
      const validationErrors = this.validatePostCreate(post);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Post validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      // Check slug availability if provided
      if (post.slug) {
        const slugCheck = await this.checkSlugAvailability(post.slug);
        if (!slugCheck.available) {
          throw new GHLError(
            'Slug is not available',
            'VALIDATION_ERROR',
            {
              field: 'slug',
              message: 'The provided slug is already in use',
              suggestedSlug: slugCheck.suggestedSlug
            }
          );
        }
      }

      const response = await this.request<GHLPost>(
        `/locations/${this.locationId}/content-management/posts`,
        {
          method: 'POST',
          body: JSON.stringify(post),
        }
      );

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to create blog post',
          'CREATE_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to create blog post', { error, blogId, post });
      throw error;
    }
  }

  public async getBlogDetails(): Promise<GHLResponse<GHLBlogDetailsResponse['data']>> {
    try {
      const response = await this.request<GHLResponse<GHLBlogDetailsResponse['data']>>(
        `/v2/locations/${this.locationId}/blogs/${this.blogId}`
      );
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blog details',
          'FETCH_FAILED'
        );
      }

      return response;
    } catch (error) {
      logger.error('Failed to fetch blog details', { error });
      throw error;
    }
  }

  async getBlogPost(blogId: string, postId: string): Promise<GHLPost> {
    try {
      const response = await this.request<GHLPost>(
        `/blogs/${blogId}/posts/${postId}`,
        { method: 'GET' }
      );

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blog post',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch blog post', { error, blogId, postId });
      throw error;
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

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private validateAuthorCreate(author: GHLAuthorCreate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate name
    if (!author.name || author.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (author.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
    }

    // Validate email
    if (!author.email || !this.validateEmail(author.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    // Validate website if provided
    if (author.website && !this.validateUrl(author.website)) {
      errors.push({ field: 'website', message: 'Valid URL is required for website' });
    }

    // Validate social media URLs if provided
    if (author.social) {
      if (author.social.twitter && !this.validateUrl(author.social.twitter)) {
        errors.push({ field: 'social.twitter', message: 'Valid URL is required for Twitter' });
      }
      if (author.social.facebook && !this.validateUrl(author.social.facebook)) {
        errors.push({ field: 'social.facebook', message: 'Valid URL is required for Facebook' });
      }
      if (author.social.linkedin && !this.validateUrl(author.social.linkedin)) {
        errors.push({ field: 'social.linkedin', message: 'Valid URL is required for LinkedIn' });
      }
    }

    // Validate bio length if provided
    if (author.bio && author.bio.length > 1000) {
      errors.push({ field: 'bio', message: 'Bio must be less than 1000 characters' });
    }

    return errors;
  }

  private validateAuthorUpdate(author: GHLAuthorUpdate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate ID
    if (!author.id || author.id.trim().length === 0) {
      errors.push({ field: 'id', message: 'Author ID is required' });
    }

    // Validate name if provided
    if (author.name !== undefined) {
      if (author.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Name cannot be empty' });
      } else if (author.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
      }
    }

    // Validate email if provided
    if (author.email !== undefined && !this.validateEmail(author.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    // Validate website if provided
    if (author.website !== undefined && !this.validateUrl(author.website)) {
      errors.push({ field: 'website', message: 'Valid URL is required for website' });
    }

    // Validate social media URLs if provided
    if (author.social) {
      if (author.social.twitter !== undefined && !this.validateUrl(author.social.twitter)) {
        errors.push({ field: 'social.twitter', message: 'Valid URL is required for Twitter' });
      }
      if (author.social.facebook !== undefined && !this.validateUrl(author.social.facebook)) {
        errors.push({ field: 'social.facebook', message: 'Valid URL is required for Facebook' });
      }
      if (author.social.linkedin !== undefined && !this.validateUrl(author.social.linkedin)) {
        errors.push({ field: 'social.linkedin', message: 'Valid URL is required for LinkedIn' });
      }
    }

    // Validate bio length if provided
    if (author.bio !== undefined && author.bio.length > 1000) {
      errors.push({ field: 'bio', message: 'Bio must be less than 1000 characters' });
    }

    return errors;
  }

  async createAuthor(author: GHLAuthorCreate): Promise<GHLAuthor> {
    try {
      const validationErrors = this.validateAuthorCreate(author);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Author validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      const response = await this.request<GHLAuthor>('/authors', {
        method: 'POST',
        body: JSON.stringify(author),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to create author',
          'CREATE_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to create author', { error, author });
      throw error;
    }
  }

  async updateAuthor(author: GHLAuthorUpdate): Promise<GHLAuthor> {
    try {
      const validationErrors = this.validateAuthorUpdate(author);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Author validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      const response = await this.request<GHLAuthor>(`/authors/${author.id}`, {
        method: 'PUT',
        body: JSON.stringify(author),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to update author',
          'UPDATE_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to update author', { error, author });
      throw error;
    }
  }

  async deleteAuthor(authorId: string): Promise<void> {
    try {
      const response = await this.request<void>(`/authors/${authorId}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to delete author',
          'DELETE_FAILED'
        );
      }
    } catch (error) {
      logger.error('Failed to delete author', { error, authorId });
      throw error;
    }
  }

  async getBlogPosts(blogId: string, params: GHLBlogPostListParams): Promise<GHLBlogPostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.authorId) queryParams.append('authorId', params.authorId);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);

      const response = await this.request<GHLBlogPostListResponse>(
        `/blogs/${blogId}/posts?${queryParams.toString()}`
      );

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blog posts',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch blog posts', { error, blogId, params });
      throw error;
    }
  }

  private validatePostUpdate(post: GHLBlogPostUpdate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate title if provided
    if (post.title !== undefined) {
      errors.push(...this.validateFieldLength('title', post.title, 1, 200));
    }

    // Validate content if provided
    if (post.content !== undefined) {
      errors.push(...this.validateFieldLength('content', post.content, 1, 50000));
    }

    // Validate status if provided
    if (post.status !== undefined && !['draft', 'published'].includes(post.status)) {
      errors.push({
        field: 'status',
        message: 'Status must be either draft or published',
        code: 'INVALID_STATUS'
      });
    }

    // Validate featured image URL if provided
    if (post.featuredImage !== undefined) {
      errors.push(...this.validateFieldPattern(
        'featuredImage',
        post.featuredImage,
        /^https?:\/\/.+/,
        'Featured image URL must be a valid HTTP(S) URL'
      ));
    }

    // Validate author ID if provided
    if (post.authorId !== undefined) {
      errors.push(...this.validateFieldPattern(
        'authorId',
        post.authorId,
        /^[a-zA-Z0-9-_]+$/,
        'Author ID must contain only letters, numbers, hyphens, and underscores'
      ));
    }

    // Validate category IDs if provided
    if (post.categoryIds !== undefined) {
      if (!Array.isArray(post.categoryIds)) {
        errors.push({
          field: 'categoryIds',
          message: 'Category IDs must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidCategoryIds = post.categoryIds.filter(id => 
          !id || typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)
        );
        if (invalidCategoryIds.length > 0) {
          errors.push({
            field: 'categoryIds',
            message: 'All category IDs must be valid strings containing only letters, numbers, hyphens, and underscores',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    // Validate meta title if provided
    if (post.metaTitle !== undefined) {
      errors.push(...this.validateFieldLength('metaTitle', post.metaTitle, 0, 100));
    }

    // Validate meta description if provided
    if (post.metaDescription !== undefined) {
      errors.push(...this.validateFieldLength('metaDescription', post.metaDescription, 0, 200));
    }

    // Validate meta keywords if provided
    if (post.metaKeywords !== undefined) {
      if (!Array.isArray(post.metaKeywords)) {
        errors.push({
          field: 'metaKeywords',
          message: 'Meta keywords must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidKeywords = post.metaKeywords.filter(keyword => 
          !keyword || typeof keyword !== 'string' || keyword.length > 50
        );
        if (invalidKeywords.length > 0) {
          errors.push({
            field: 'metaKeywords',
            message: 'All meta keywords must be non-empty strings with maximum length of 50 characters',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    // Validate publishedAt if provided
    if (post.publishedAt !== undefined) {
      const date = new Date(post.publishedAt);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'publishedAt',
          message: 'Published date must be a valid ISO 8601 date string',
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Validate tags if provided
    if (post.tags !== undefined) {
      if (!Array.isArray(post.tags)) {
        errors.push({
          field: 'tags',
          message: 'Tags must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidTags = post.tags.filter(tag => 
          !tag || typeof tag !== 'string' || tag.length > 50
        );
        if (invalidTags.length > 0) {
          errors.push({
            field: 'tags',
            message: 'All tags must be non-empty strings with maximum length of 50 characters',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    return errors;
  }

  public async updateBlogPost(blogId: string, postId: string, post: GHLBlogPostUpdate): Promise<GHLPost> {
    try {
      // Validate post data
      const validationErrors = this.validatePostUpdate(post);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Post validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      // Check slug availability if slug is being updated
      if (post.slug) {
        const slugCheck = await this.checkSlugAvailability(post.slug);
        if (!slugCheck.available) {
          throw new GHLError(
            'Slug is not available',
            'VALIDATION_ERROR',
            {
              field: 'slug',
              message: 'The provided slug is already in use',
              suggestedSlug: slugCheck.suggestedSlug
            }
          );
        }
      }

      const response = await this.request<GHLPost>(
        `/blogs/${blogId}/posts/${postId}`,
        {
          method: 'PUT',
          body: JSON.stringify(post),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to update blog post', { error, blogId, postId, post });
      throw error;
    }
  }

  public async deleteBlogPost(blogId: string, postId: string): Promise<void> {
    try {
      await this.request(
        `/blogs/${blogId}/posts/${postId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Failed to delete blog post', { error, blogId, postId });
      throw error;
    }
  }

  async getBlogsByLocation(locationId: string, params: GHLBlogListParams = {}): Promise<GHLBlogListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);

      const response = await this.request<GHLBlogListResponse>(
        `/locations/${locationId}/blogs?${queryParams.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blogs by location',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch blogs by location', { error, locationId, params });
      throw error;
    }
  }

  async getBlog(blogId: string): Promise<GHLBlog> {
    try {
      const response = await this.request<GHLBlog>(`/blogs/${blogId}`);
      
      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blog',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch blog', { error, blogId });
      throw error;
    }
  }

  private validateRequiredFields(data: Record<string, any>, requiredFields: string[]): GHLValidationError[] {
    const errors: GHLValidationError[] = [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD'
        });
      }
    }
    
    return errors;
  }

  private validateFieldLength(field: string, value: string, min: number, max: number): GHLValidationError[] {
    const errors: GHLValidationError[] = [];
    
    if (value.length < min) {
      errors.push({
        field,
        message: `${field} must be at least ${min} characters`,
        code: 'MIN_LENGTH'
      });
    }
    
    if (value.length > max) {
      errors.push({
        field,
        message: `${field} must be at most ${max} characters`,
        code: 'MAX_LENGTH'
      });
    }
    
    return errors;
  }

  private validateFieldPattern(field: string, value: string, pattern: RegExp, message: string): GHLValidationError[] {
    const errors: GHLValidationError[] = [];
    
    if (!pattern.test(value)) {
      errors.push({
        field,
        message,
        code: 'INVALID_FORMAT'
      });
    }
    
    return errors;
  }

  private validateBlogCreate(blog: GHLBlogCreate): GHLValidationError[] {
    const errors: GHLValidationError[] = [];

    // Validate required fields
    if (!blog.name) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      errors.push(...this.validateFieldLength('name', blog.name, 1, 100));
    }

    if (!blog.locationId) {
      errors.push({
        field: 'locationId',
        message: 'Location ID is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      errors.push(...this.validateFieldPattern(
        'locationId',
        blog.locationId,
        /^[a-zA-Z0-9-_]+$/,
        'Location ID must contain only letters, numbers, hyphens, and underscores'
      ));
    }

    // Validate optional fields
    if (blog.description) {
      errors.push(...this.validateFieldLength('description', blog.description, 0, 500));
    }

    if (blog.metaTitle) {
      errors.push(...this.validateFieldLength('metaTitle', blog.metaTitle, 0, 100));
    }

    if (blog.metaDescription) {
      errors.push(...this.validateFieldLength('metaDescription', blog.metaDescription, 0, 200));
    }

    if (blog.metaKeywords) {
      if (!Array.isArray(blog.metaKeywords)) {
        errors.push({
          field: 'metaKeywords',
          message: 'Meta keywords must be an array',
          code: 'INVALID_TYPE'
        });
      } else {
        const invalidKeywords = blog.metaKeywords.filter(keyword => 
          !keyword || typeof keyword !== 'string' || keyword.length > 50
        );
        if (invalidKeywords.length > 0) {
          errors.push({
            field: 'metaKeywords',
            message: 'All meta keywords must be non-empty strings with maximum length of 50 characters',
            code: 'INVALID_FORMAT'
          });
        }
      }
    }

    return errors;
  }

  async createBlog(blog: GHLBlogCreate): Promise<GHLBlog> {
    try {
      // Validate blog data
      const validationErrors = this.validateBlogCreate(blog);
      if (validationErrors.length > 0) {
        throw new GHLError(
          'Blog validation failed',
          'VALIDATION_ERROR',
          { validationErrors }
        );
      }

      const response = await this.request<GHLBlog>(`/locations/${blog.locationId}/blogs`, {
        method: 'POST',
        body: JSON.stringify(blog),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to create blog',
          'CREATE_FAILED'
        );
      }

      // Fetch the complete blog data
      const createdBlog = await this.getBlog(response.data.id);
      if (!createdBlog) {
        throw new GHLError(
          'Failed to fetch created blog',
          'FETCH_FAILED'
        );
      }

      return createdBlog;
    } catch (error) {
      logger.error('Failed to create blog', { error, blog });
      throw error;
    }
  }

  async getBlogs(params: GHLBlogListParams = {}): Promise<GHLBlogListResponse['data']> {
    try {
      const response = await this.request<GHLBlogListResponse['data']>(
        '/blogs',
        {
          method: 'GET',
          params
        }
      );

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to fetch blogs',
          'FETCH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch blogs', { error });
      throw error;
    }
  }

  async publishBlogPost(post: GHLBlogPostCreate): Promise<GHLPost> {
    try {
      const response = await this.request<GHLPost>(`/blogs/${this.blogId}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          ...post,
          blogId: this.blogId
        }),
      });

      if (!response.success) {
        throw new GHLError(
          response.message || 'Failed to publish post',
          'PUBLISH_FAILED'
        );
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to publish post', { error, post });
      throw error;
    }
  }
}

export const ghlClient = new GHLClient(); 