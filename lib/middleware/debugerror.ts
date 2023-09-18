import type { NextFunction, Request, Response } from 'express';

export function debugErrorMiddleware(err: unknown, req: Request, _res: Response, next: NextFunction): void {
    console.warn(req.ip, req.method, req.url, err);
    return next(err);
}
