import { deepEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError, type ApiErrorResponse } from '../lib/index.mjs';

await describe('ApiError', async function () {
    await describe('fromApiErrorReponse', async function () {
        await it('should convert ApiErrorResponse into ApiError', function () {
            const input = {
                success: false,
                status: 400,
                code: 'BAD_REQUEST',
                message: 'Bad Request',
                errors: [
                    {
                        path: 'query.name',
                        message: 'should be string',
                    },
                ],
                additionalHeaders: {
                    'x-foo': 'bar',
                },
            } satisfies ApiErrorResponse;

            const expected = new ApiError(input.status, input.code, input.message);
            expected.errors = input.errors;
            expected.additionalHeaders = input.additionalHeaders;

            const actual = ApiError.fromApiErrorReponse(input);
            deepEqual(actual, expected);
        });

        await it('should convert ApiErrorResponse into ApiError (no additional fields)', function () {
            const input = {
                success: false,
                status: 400,
                code: 'BAD_REQUEST',
                message: 'Bad Request',
            } satisfies ApiErrorResponse;

            const expected = new ApiError(input.status, input.code, input.message);

            const actual = ApiError.fromApiErrorReponse(input);
            deepEqual(actual, expected);
        });
    });
});
