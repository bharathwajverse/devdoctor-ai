import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse, EnvironmentContext, DiagnosisResult } from '../../shared/types.js';
import { config } from '../config.js';
import {
  ApiError,
  MissingImageError,
  InvalidFileTypeError,
  FileTooLargeError,
  MissingOriginalAnalysisError,
} from '../errors/apiErrors.js';

export interface ValidatedAnalyzeBody {
  rawBase64?: string;
  mimeType?: string;
  sizeBytes?: number;
  extractedText?: string;
  context: EnvironmentContext;
  description?: string;
  demoMode: boolean;
}

export interface ValidatedVerifyBody {
  originalAnalysis: DiagnosisResult;
  rawBase64?: string;
  mimeType?: string;
  sizeBytes?: number;
  extractedText?: string;
  notes?: string;
  demoMode: boolean;
}

export function createApiError(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

export const VALID_CONTEXTS: EnvironmentContext[] = [
  'terminal',
  'browser',
  'ide',
  'docker',
  'cicd',
  'system',
  'other',
];

export function validateContext(context?: string): EnvironmentContext {
  if (!context) return 'terminal';
  const normalized = context.toLowerCase() as EnvironmentContext;
  return VALID_CONTEXTS.includes(normalized) ? normalized : 'other';
}

export function parseAndValidateBase64(rawInput: string) {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new MissingImageError('The image payload is missing or not a valid string.');
  }

  // Check trivially small payload
  if (rawInput.trim().length < 50) {
    throw new ApiError(400, 'INVALID_IMAGE_DATA', 'The provided image data is too small to be a valid image.');
  }

  let mimeType = 'image/png';
  let cleanBase64 = rawInput.trim();

  const match = cleanBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/i);
  if (match) {
    mimeType = match[1].toLowerCase();
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }
    cleanBase64 = match[2].trim();
  } else {
    if (cleanBase64.startsWith('data:') && !cleanBase64.includes(';base64,')) {
      throw new InvalidFileTypeError('Unsupported data URL format. Base64 encoding is required.');
    }
  }

  // Normalize image/jpg to image/jpeg
  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(mimeType)) {
    throw new InvalidFileTypeError(`Invalid MIME type '${mimeType}'. Allowed formats: ${allowed.join(', ')}.`);
  }

  const padding = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0;
  const byteSize = (cleanBase64.length * 3) / 4 - padding;
  const maxBytes = (config.maxImageSizeMb || 10) * 1024 * 1024;

  if (byteSize > maxBytes) {
    throw new FileTooLargeError(`Image exceeds maximum allowed size of ${config.maxImageSizeMb || 10}MB.`);
  }

  return {
    mimeType,
    rawBase64: cleanBase64,
    sizeBytes: byteSize,
  };
}

export const parseAndValidateBase64Image = parseAndValidateBase64;

export function validateAnalyzeRequest(req: Request, res: Response, next: NextFunction) {
  const { image, extractedText, context, description, demoMode } = req.body || {};

  if (!image && !extractedText) {
    return res.status(400).json(createApiError('MISSING_IMAGE', 'The image or extractedText field is required.'));
  }

  try {
    let cleanBase64: string | undefined;
    let mimeType: string | undefined;
    let byteSize: number | undefined;

    if (image) {
      const parsed = parseAndValidateBase64(image);
      cleanBase64 = parsed.rawBase64;
      mimeType = parsed.mimeType;
      byteSize = parsed.sizeBytes;
    }

    const validCtx = validateContext(context);

    (req as any).validatedBody = {
      rawBase64: cleanBase64,
      mimeType,
      sizeBytes: byteSize,
      extractedText: typeof extractedText === 'string' ? extractedText.trim() : undefined,
      context: validCtx,
      description,
      demoMode: Boolean(demoMode),
    } satisfies ValidatedAnalyzeBody;

    next();
  } catch (err: any) {
    return res.status(err.status || err.statusCode || 400).json(createApiError(err.code || 'VALIDATION_ERROR', err.message));
  }
}

export function validateVerifyRequest(req: Request, res: Response, next: NextFunction) {
  const { originalAnalysis, verificationImage, extractedText, notes, demoMode } = req.body || {};

  if (!originalAnalysis || !originalAnalysis.id) {
    return res
      .status(400)
      .json(
        createApiError(
          'MISSING_ORIGINAL_ANALYSIS',
          'The originalAnalysis object with a valid diagnosis id is required.'
        )
      );
  }

  if (!verificationImage && !extractedText) {
    return res
      .status(400)
      .json(createApiError('MISSING_IMAGE', 'The verificationImage or extractedText field is required.'));
  }

  try {
    let cleanBase64: string | undefined;
    let mimeType: string | undefined;
    let byteSize: number | undefined;

    if (verificationImage) {
      const parsed = parseAndValidateBase64(verificationImage);
      cleanBase64 = parsed.rawBase64;
      mimeType = parsed.mimeType;
      byteSize = parsed.sizeBytes;
    }

    (req as any).validatedBody = {
      originalAnalysis,
      rawBase64: cleanBase64,
      mimeType,
      sizeBytes: byteSize,
      extractedText: typeof extractedText === 'string' ? extractedText.trim() : undefined,
      notes,
      demoMode: Boolean(demoMode),
    } satisfies ValidatedVerifyBody;

    next();
  } catch (err: any) {
    return res.status(err.status || err.statusCode || 400).json(createApiError(err.code || 'VALIDATION_ERROR', err.message));
  }
}
