import { APIError, API_ERROR_CODES, handleAPIError } from './api-error';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffFactor } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: APIError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = handleAPIError(error);

      // Don't retry certain errors
      if (
        lastError.code === API_ERROR_CODES.UNAUTHORIZED ||
        lastError.code === API_ERROR_CODES.BUDGET_EXCEEDED ||
        lastError.code === API_ERROR_CODES.INVALID_INPUT
      ) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // This should never happen due to the throw in the loop
  throw lastError!;
} 