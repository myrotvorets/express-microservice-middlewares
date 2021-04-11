import type { NextFunction, Request, Response } from 'express';

export function debugErrorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    console.warn(err);
    return next(err);
}
