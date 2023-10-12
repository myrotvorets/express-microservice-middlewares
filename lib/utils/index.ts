import type { ErrorResponse } from '../middleware/types';

export function badGatewayFromError(err: Error): ErrorResponse {
    return {
        success: false,
        status: 502,
        code: 'BAD_GATEWAY',
        message: err.message,
    };
}
