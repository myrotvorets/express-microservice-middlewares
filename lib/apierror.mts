import { ValidationErrorItem } from 'express-openapi-validator/dist/framework/types.js';
import type { ApiErrorResponse } from './index.mjs';

export class ApiError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly errorMessage: string;

    public additionalHeaders: Record<string, string> = {};
    public errors: Partial<ValidationErrorItem>[] = [];

    public constructor(status: number, code: string, message: string, options?: ErrorOptions) {
        const msg = `Error ${code}: ${message} [${status}]`;
        super(msg, options);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.errorMessage = message;
    }

    public static fromApiErrorReponse(response: ApiErrorResponse): ApiError {
        const error = new ApiError(response.status, response.code, response.message);
        if (response.errors) {
            error.errors = response.errors;
        }

        if (response.additionalHeaders) {
            error.additionalHeaders = response.additionalHeaders;
        }

        return error;
    }
}

declare module 'express' {
    interface Request {
        overriddenError?: ApiError | undefined; // NOSONAR
    }
}
