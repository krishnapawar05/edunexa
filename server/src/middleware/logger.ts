import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();

    const logLine = `[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip})`;

    if (statusCode >= 500) {
      console.error(`\x1b[31m${logLine}\x1b[0m`);
    } else if (statusCode >= 400) {
      console.warn(`\x1b[33m${logLine}\x1b[0m`);
    } else {
      console.log(`\x1b[32m${logLine}\x1b[0m`);
    }
  });

  next();
}
