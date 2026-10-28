export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class MissingImageError extends ApiError {
  constructor(message = 'The image payload is required.') {
    super(400, 'MISSING_IMAGE', message);
  }
}

export class InvalidFileTypeError extends ApiError {
  constructor(message = 'Unsupported file type. Only PNG, JPEG, and WebP are supported.') {
    super(400, 'INVALID_FILE_TYPE', message);
  }
}

export class FileTooLargeError extends ApiError {
  constructor(message = 'Image payload exceeds the maximum allowed size of 10MB.') {
    super(413, 'FILE_TOO_LARGE', message);
  }
}

export class ModelUnavailableError extends ApiError {
  constructor(message = 'Inference model is currently offline or unreachable.') {
    super(503, 'MODEL_UNAVAILABLE', message);
  }
}
