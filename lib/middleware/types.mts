import type { ValidationErrorItem } from 'express-openapi-validator/dist/framework/types.js';

export interface ApiErrorResponse {
    success: false;
    status: number;
    code: string;
    message: string;
    errors?: Partial<ValidationErrorItem>[] | undefined; // NOSONAR
    additionalHeaders?: Record<string, string> | undefined; // NOSONAR
}
