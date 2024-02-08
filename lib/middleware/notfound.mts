import type { RequestHandler } from 'express';
import { ApiError } from '../apierror.mjs';

export const notFoundMiddleware: RequestHandler = (req, _res, next) =>
    next(req.route ? undefined : new ApiError(404, 'NOT_FOUND', 'Not found'));
