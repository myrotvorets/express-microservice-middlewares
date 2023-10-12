import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from './types.mjs';

const payload: ErrorResponse = {
    success: false,
    status: 404,
    code: 'NOT_FOUND',
    message: 'Not found',
};

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.route) {
        next(payload);
    } else {
        next();
    }
}
