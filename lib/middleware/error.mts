import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types.js';
import { ApiErrorResponse } from './types.mjs';
import { ApiError } from '../apierror.mjs';

const statusMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    413: 'REQUEST_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
};

const messageMap: Record<number, string> = {
    400: 'Request validation failed',
    401: 'You are not authorized to perform this request',
    403: 'Access denied',
    404: 'Not found',
    405: 'Method not allowed',
    413: 'Request entity too large',
    415: 'Unsupported media type',
};

function transformOpenApiError(err: HttpError): ApiError {
    const { status, errors, message } = err;
    const code = statusMap[status] ?? 'UNKNOWN_ERROR';

    const result = new ApiError(status, code, message || (messageMap[status] ?? ''), { cause: err });
    result.errors = errors;
    if (err.headers) {
        result.additionalHeaders = { ...err.headers };
    }

    return result;
}

function transformSyntaxError(err: SyntaxError): ApiError {
    let status = 500;
    let code = 'UNKNOWN_ERROR';
    let message = 'Unknown error';

    if ('status' in err && typeof err.status === 'number') {
        status = err.status;
    }

    if ('type' in err && typeof err.type === 'string') {
        switch (err.type) {
            case 'entity.parse.failed':
            case 'request.aborted':
            case 'request.size.invalid':
                code = 'BAD_REQUEST';
                message = err.message || 'Request validation failed';
                break;

            case 'encoding.unsupported':
            case 'charset.unsupported':
                code = 'UNSUPPORTED_MEDIA_TYPE';
                message = err.message || 'Unsupported media type';
                break;

            case 'entity.verify.failed':
                code = 'FORBIDDEN';
                message = err.message || 'Access denied';
                break;

            case 'entity.too.large':
            case 'parameters.too.many':
                code = 'REQUEST_TOO_LARGE';
                message = err.message || 'Request entity too large';
                break;

            default:
                break;
        }
    }

    return new ApiError(status, code, message, { cause: err });
}

function transformObjectToError(err: object): ApiError {
    const status = 'status' in err && typeof err.status === 'number' && Number.isInteger(err.status) ? err.status : 500;
    const code = 'code' in err && typeof err.code === 'string' ? err.code : 'UNKNOWN_ERROR';
    const message = 'message' in err && typeof err.message === 'string' ? err.message : 'Unknown error';
    const cause = err instanceof Error ? err : undefined;
    return new ApiError(status, code, message, { cause });
}

export interface ErrorMiddlewareOptions {
    beforeSendHook?: (error: ApiError | null, originalError: unknown, req: Request, res: Response) => boolean;
}

const defaultBeforeSendHook = (): boolean => true;

export function errorMiddleware(options: ErrorMiddlewareOptions = {}): ErrorRequestHandler {
    const beforeSend = options.beforeSendHook ?? defaultBeforeSendHook;
    return function errorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
        if (res.headersSent || typeof err !== 'object' || err === null || Array.isArray(err)) {
            if (beforeSend(null, err, req, res)) {
                next(err);
            }

            return;
        }

        let error: ApiError;

        if (req.overriddenError) {
            error = req.overriddenError;
            delete req.overriddenError;
        } else if (err instanceof HttpError) {
            error = transformOpenApiError(err);
        } else if (err instanceof SyntaxError) {
            error = transformSyntaxError(err);
        } else if (!(err instanceof ApiError)) {
            error = transformObjectToError(err);
        } else {
            error = err;
        }

        if (beforeSend(error, err, req, res)) {
            let statusCode = error.status;
            if ([502, 503, 504].includes(statusCode) || error.status < 400 || error.status > 599) {
                statusCode = 500;
            }

            const response: ApiErrorResponse = {
                success: false,
                status: error.status,
                code: error.code,
                message: error.errorMessage,
            };

            if (error.errors.length > 0) {
                response.errors = error.errors;
            }

            res.status(statusCode);
            Object.keys(error.additionalHeaders).forEach((header) =>
                res.header(header, error.additionalHeaders[header]),
            );

            res.json(response);
        }
    };
}
