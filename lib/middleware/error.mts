import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types.js';
import type { ErrorResponse } from './types.mjs';

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

        /* c8 ignore start */
        default:
            break;
        /* c8 ignore stop */
    }

    return result;
}

function transformSyntaxError(err: SyntaxError): ErrorResponse {
    const result: ErrorResponse = {
        success: false,
        status: 500,
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error',
    };

    if ('status' in err && typeof err.status === 'number') {
        result.status = err.status;
    }

    if ('type' in err && typeof err.type === 'string') {
        switch (err.type) {
            case 'entity.parse.failed':
            case 'request.aborted':
            case 'request.size.invalid':
                result.code = 'BAD_REQUEST';
                result.message = err.message || 'Request validation failed';
                break;

            case 'encoding.unsupported':
            case 'charset.unsupported':
                result.code = 'UNSUPPORTED_MEDIA_TYPE';
                result.message = err.message || 'Unsupported media type';
                break;

            case 'entity.verify.failed':
                result.code = 'FORBIDDEN';
                result.message = err.message || 'Access denied';
                break;

            case 'entity.too.large':
            case 'parameters.too.many':
                result.code = 'REQUEST_TOO_LARGE';
                result.message = err.message || 'Request entity too large';
                break;

            default:
                break;
        }
    }

    return result;
}

export interface ErrorMiddlewareOptions {
    beforeSendHook?: (error: ErrorResponse | null, originalError: unknown, req: Request, res: Response) => boolean;
}

const defaultBeforeSendHook = (): boolean => true;

export function errorMiddlewareEx(options: ErrorMiddlewareOptions = {}): ErrorRequestHandler {
    const beforeSend = options.beforeSendHook ?? defaultBeforeSendHook;
    return function errorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
        if (res.headersSent || typeof err !== 'object' || err === null || Array.isArray(err)) {
            if (beforeSend(null, err, req, res)) {
                next(err);
            }

            return;
        }

        let error: ErrorResponse;

        if (req.overriddenError) {
            error = req.overriddenError;
            req.overriddenError = undefined;
        } else if (err instanceof HttpError) {
            error = transformOpenApiError(err);
        } else if (err instanceof SyntaxError) {
            error = transformSyntaxError(err);
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

        if (error.status < 400 || error.status > 599) {
            error.status = 500;
        }

        if (beforeSend(error, err, req, res)) {
            const { additionalHeaders } = error;
            if (additionalHeaders) {
                Object.keys(additionalHeaders).forEach((header) => res.header(header, additionalHeaders[header]));
            }

            error.additionalHeaders = undefined;
            res.status(error.status).json(error);
        }
    };
}

export const errorMiddleware: ErrorRequestHandler = errorMiddlewareEx();
