import { ValidationErrorItem } from 'express-openapi-validator/dist/framework/types';

export interface ErrorResponse {
    success: false;
    status: number;
    code: string;
    message: string;
    errors?: (
        | ValidationErrorItem
        | {
              path: string;
              message?: string;
              error_code?: string;
          }
    )[];
    additionalHeaders?: Record<string, string>;
}

declare module 'express' {
    interface Request {
        overriddenError?: ErrorResponse;
    }
}
