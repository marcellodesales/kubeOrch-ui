/**
 * Centralized error handling utility
 */

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract error message from various error formats
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "An error occurred"
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    const apiError = error as ApiError;

    // Try to get error message from API response
    if (apiError.response?.data?.error) {
      return apiError.response.data.error;
    }

    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    // Fall back to error message
    if (apiError.message) {
      return apiError.message;
    }
  }

  return defaultMessage;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    return !apiError.response && !!apiError.message;
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    return (
      apiError.response?.status === 401 || apiError.response?.status === 403
    );
  }
  return false;
}
