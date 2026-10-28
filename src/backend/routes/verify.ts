import { Router, Request, Response } from 'express';
import { validateVerifyRequest, ValidatedVerifyBody } from '../middleware/validation.js';
import { ModelRouter } from '../services/modelRouter.js';
import { ApiErrorResponse } from '../../shared/types.js';

const router = Router();

router.post('/', validateVerifyRequest, async (req: Request, res: Response) => {
  const validated = (req as any).validatedBody as ValidatedVerifyBody;

  try {
    const result = await ModelRouter.verify(
      validated.originalAnalysis,
      validated.rawBase64,
      validated.notes,
      validated.demoMode,
      validated.extractedText
    );

    res.status(200).json(result);
  } catch (err: any) {
    const status = err.status || err.statusCode || 500;
    const errorResponse: ApiErrorResponse = {
      error: {
        code: err.code || 'VERIFICATION_FAILED',
        message: err.message || 'An unexpected error occurred during follow-up verification.',
        details: err.details,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(status).json(errorResponse);
  }
});

export default router;
