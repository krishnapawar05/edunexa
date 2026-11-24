import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiErrorResponse } from '@edunexa/shared';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any[];

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError || (err as any).name === 'ZodError') {
    const zodErr = err as ZodError;
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided.',
        details: (zodErr.errors || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    };
    res.status(422).json(errorResponse);
    return;
  }

  // Handle Known Domain/Application Errors
  if (err instanceof AppError || (err as any).statusCode) {
    const statusCode = (err as any).statusCode || (err as any).status || 400;
    const code = (err as any).code || 'APPLICATION_ERROR';
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message: err.message,
        details: (err as any).details,
      },
    };
    res.status(statusCode).json(errorResponse);
    return;
  }

  // Handle Unexpected Server Errors
  console.error('[UNHANDLED EXCEPTION]:', err);
  const isDev = process.env.NODE_ENV !== 'production';

  // Specific handling for Prisma / Database initialization errors
  const errName = (err as any)?.name || '';
  const isDbError =
    errName.includes('Prisma') ||
    err.message?.includes('database') ||
    err.message?.includes('column') ||
    err.message?.includes('relation') ||
    err.message?.includes('Connection');

  let sanitizedMessage = isDev ? err.message : 'An unexpected internal server error occurred.';
  if (isDbError && !isDev) {
    sanitizedMessage = 'Database service synchronizing. Please retry in a few moments.';
  }

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: isDbError ? 'DATABASE_ERROR' : 'INTERNAL_SERVER_ERROR',
      message: sanitizedMessage,
      details: isDev && err.stack ? [{ message: err.stack }] : undefined,
    },
  };

  res.status(500).json(errorResponse);
}
