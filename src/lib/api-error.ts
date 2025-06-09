export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Failed to fetch')) {
      return new APIError(
        'Network error. Please check your connection.',
        0,
        API_ERROR_CODES.NETWORK_ERROR
      );
    }

    // JSON parse errors
    if (error.message.includes('JSON')) {
      return new APIError(
        'Invalid response from server.',
        500,
        API_ERROR_CODES.SERVER_ERROR
      );
    }
  }

  // Default error
  return new APIError(
    'An unexpected error occurred.',
    500,
    API_ERROR_CODES.SERVER_ERROR
  );
}

export function getErrorMessage(error: APIError): string {
  switch (error.code) {
    case API_ERROR_CODES.UNAUTHORIZED:
      return 'Please sign in to continue.';
    case API_ERROR_CODES.BUDGET_EXCEEDED:
      return 'Daily budget exceeded. Please try again tomorrow.';
    case API_ERROR_CODES.INVALID_INPUT:
      return 'Please check your input and try again.';
    case API_ERROR_CODES.RATE_LIMITED:
      return 'Too many requests. Please try again later.';
    case API_ERROR_CODES.NETWORK_ERROR:
      return 'Network error. Please check your connection.';
    case API_ERROR_CODES.SERVER_ERROR:
      return 'Server error. Please try again later.';
    default:
      return error.message;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
} 