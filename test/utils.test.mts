import { deepEqual, equal } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError, badGatewayFromError } from '../lib/index.mjs';

await describe('badGatewayFromError', async function () {
    await it('should return the expected response', function () {
        const expected = {
            status: 502,
            code: 'BAD_GATEWAY',
            message: 'Error message',
        };

        const error = new Error(expected.message);
        const actual = badGatewayFromError(error);
        equal(actual instanceof ApiError, true);
        equal(actual.status, expected.status);
        equal(actual.code, expected.code);
        equal(actual.errorMessage, expected.message);
        deepEqual(actual.cause, error);
    });
});
