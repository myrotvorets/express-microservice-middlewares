import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from './types';

const payload: ErrorResponse = {
    success: false,
    status: 404,
    code: 'NOT_FOUND',
    message: 'Not found',
};

export function notFoundMiddleware(req: Request, res: Response, next: NextFunction): void {
    next(payload);
}
