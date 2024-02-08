import { ApiError } from '../apierror.mjs';

export const badGatewayFromError = (err: Error): ApiError =>
    new ApiError(502, 'BAD_GATEWAY', err.message, { cause: err });
