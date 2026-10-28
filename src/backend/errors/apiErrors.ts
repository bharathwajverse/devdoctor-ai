export class ApiError extends Error {
  public statusCode: number;
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.status = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class MissingImageError extends ApiError {
  constructor(message = 'The image payload is required.') {
    super(400, 'MISSING_IMAGE', message);
    this.name = 'MissingImageError';
  }
}

export class InvalidFileTypeError extends ApiError {
  constructor(message = 'Unsupported file type. Only PNG, JPEG, and WebP are supported.') {
    super(400, 'INVALID_FILE_TYPE', message);
    this.name = 'InvalidFileTypeError';
  }
}

export class FileTooLargeError extends ApiError {
  constructor(message = 'Image payload exceeds the maximum allowed size of 10MB.') {
    super(413, 'FILE_TOO_LARGE', message);
    this.name = 'FileTooLargeError';
  }
}

export class MissingOriginalAnalysisError extends ApiError {
  constructor(message = 'The originalAnalysis object with a valid diagnosis id is required.') {
    super(400, 'MISSING_ORIGINAL_ANALYSIS', message);
    this.name = 'MissingOriginalAnalysisError';
  }
}

export class ModelUnavailableError extends ApiError {
  constructor(message = 'Inference model is currently offline or unreachable.') {
    super(503, 'MODEL_UNAVAILABLE', message);
    this.name = 'ModelUnavailableError';
  }
}

export class ModelInferenceError extends ApiError {
  constructor(message = 'Multimodal model inference failed.') {
    super(502, 'MODEL_INFERENCE_FAILED', message);
    this.name = 'ModelInferenceError';
  }
}

export class RouteNotFoundError extends ApiError {
  constructor(message = 'Requested API endpoint does not exist.') {
    super(404, 'ROUTE_NOT_FOUND', message);
    this.name = 'RouteNotFoundError';
  }
}
