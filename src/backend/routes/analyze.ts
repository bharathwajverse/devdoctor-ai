import { Router, Request, Response } from 'express';
import { validateAnalyzeRequest, ValidatedAnalyzeBody } from '../middleware/validation.js';
import { ModelRouter } from '../services/modelRouter.js';
import { ApiErrorResponse } from '../../shared/types.js';

const router = Router();

router.post('/', validateAnalyzeRequest, async (req: Request, res: Response) => {
  const validated = (req as any).validatedBody as ValidatedAnalyzeBody;

  try {
    const diagnosis = await ModelRouter.analyze(
      validated.rawBase64,
      validated.context as any,
      validated.description,
      validated.demoMode
    );

    res.status(200).json(diagnosis);
  } catch (err: any) {
    const status = err.status || 500;
    const errorResponse: ApiErrorResponse = {
      error: {
        code: err.code || 'DIAGNOSIS_FAILED',
        message: err.message || 'An unexpected error occurred while analyzing the screenshot.',
        details: err.details,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(status).json(errorResponse);
  }
});

export default router;
