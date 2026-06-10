export interface ApiError {
  statusCode: number;
  message: string;
  details?: unknown;
}

export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: unknown
): ApiError {
  return { statusCode, message, details };
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }
  return createErrorResponse('Erro interno do servidor', 500);
}