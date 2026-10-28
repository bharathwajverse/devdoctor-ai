import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import analyzeRouter from './routes/analyze.js';
import verifyRouter from './routes/verify.js';
import { ApiErrorResponse } from '../shared/types.js';

export const app = express();

// Security and CORS middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// High payload limit for base64 screenshots (15MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Request logging in development
if (config.nodeEnv !== 'test') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/verify', verifyRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  const notFoundResponse: ApiErrorResponse = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(404).json(notFoundResponse);
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const isTooLarge = status === 413 || err.type === 'entity.too.large';
  const errorCode = err.code || (isTooLarge ? 'FILE_TOO_LARGE' : 'INTERNAL_SERVER_ERROR');
  const message = isTooLarge
    ? 'The uploaded payload exceeds the maximum permitted server size.'
    : (err.message || 'An unexpected internal server error occurred.');

  const errorResponse: ApiErrorResponse = {
    error: {
      code: errorCode,
      message,
      details: config.nodeEnv === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(status).json(errorResponse);
});

export function startServer(port: number = config.port) {
  return app.listen(port, () => {
    console.log(` devdoctor-ai backend listening on http://${config.host}:${port}`);
    console.log(` Model Provider: ${config.modelProvider} (Target: ${config.ollama.model})`);
    console.log(` Health check available at http://${config.host}:${port}/api/health`);
  });
}

// Start immediately when executed directly
if (process.env.NODE_ENV !== 'test' && import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  startServer();
}
