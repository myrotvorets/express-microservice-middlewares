import type { NextFunction, Request, Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import type { ErrorResponse } from './types';

function transformOpenApiError(err: HttpError): ErrorResponse {
    const result: ErrorResponse = {
        success: false,
        status: 500,
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error',
    };

    result.status = err.status;
    result.errors = err.errors;
    switch (err.status) {
        case 400:
            result.code = 'BAD_REQUEST';
            result.message = err.message || 'Request validation failed';
            break;

        case 401:
            result.code = 'UNAUTHORIZED';
            result.message = err.message || 'You are not authorized to perform this request';
            break;

        case 403:
            result.code = 'FORBIDDEN';
            result.message = err.message || 'Access denied';
            break;

        case 404:
            result.code = 'NOT_FOUND';
            result.message = err.message || 'Not found';
            break;

        case 405:
            result.code = 'METHOD_NOT_ALLOWED';
            result.message = err.message || 'Method not allowed';
            break;

        case 413:
            result.code = 'REQUEST_TOO_LARGE';
            result.message = err.message || 'Request entity too large';
            break;

        case 415:
            result.code = 'UNSUPPORTED_MEDIA_TYPE';
            result.message = err.message || 'Unsupported media type';
            break;

        default:
            break;
    }

    return result;
}

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent || typeof err !== 'object' || err === null || Array.isArray(err)) {
        next(err);
        return;
    }

    let error: ErrorResponse;

    if (req.overriddenError) {
        error = req.overriddenError;
        req.overriddenError = undefined;
    } else if (err instanceof HttpError) {
        error = transformOpenApiError(err);
    } else if ('status' in err) {
        const { status = 500, code = 'UNKNOWN_ERROR', message = 'Unknown error' } = err as Record<string, unknown>;
        error = {
            success: false,
            status: +`${status}`,
            code: `${code}`,
            message: `${message}`,
        };
    } else {
        error = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
        };
    }

    const { additionalHeaders } = error;
    if (additionalHeaders) {
        Object.keys(additionalHeaders).forEach((header) => res.header(header, additionalHeaders[header]));
    }

    error.additionalHeaders = undefined;
    if (error.status < 400 || error.status > 599) {
        error.status = 500;
    }

    res.status(error.status).json(error);
}
