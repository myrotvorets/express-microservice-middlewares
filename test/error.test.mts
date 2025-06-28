/* eslint-disable no-await-in-loop */
import { describe, it } from 'node:test';
import type { RequestListener } from 'node:http';
import request from 'supertest';
import express, { type NextFunction, type Request, RequestHandler, type Response } from 'express';
import { HttpError, InternalServerError, MethodNotAllowed } from 'express-openapi-validator/dist/framework/types.js';
import { ApiError, type ApiErrorResponse, type ErrorMiddlewareOptions, errorMiddleware } from '../lib/index.mjs';

function buildServer(fn: RequestHandler): RequestListener {
    const server = express();
    server.set('env', 'test');
    server.use(fn);
    server.use(errorMiddleware());
    return server as RequestListener;
}

const handlerFactory =
    (err: unknown): RequestHandler =>
    (_req, _res, next): void =>
        next(err);

function handlerForOverriddenError(req: Request, _res: Response, next: NextFunction): void {
    req.overriddenError = new ApiError(401, 'Unauthorized', 'Unauthorized');
    req.overriddenError.additionalHeaders['WWW-Authenticate'] = 'Bearer';
    next(new Error('some error'));
}

await describe('errorMiddleware', async function () {
    for (const e of [123, 'string', [], Infinity, -Infinity]) {
        await it(`should invoke the default handler (${e})`, async function () {
            const server = buildServer(handlerFactory(e));
            await request(server)
                .get('/')
                .expect(500)
                .expect(/<!DOCTYPE html/u)
                .expect(/<title>Error<\/title>/u);
        });
    }

    for (const e of [null, undefined, false, '', 0, NaN]) {
        await it(`should invoke the default 404 handler (${e})`, async function () {
            const server = buildServer(handlerFactory(e));
            await request(server)
                .get('/')
                .expect(404)
                .expect(/<!DOCTYPE html/u)
                .expect(/<title>Error<\/title>/u);
        });
    }

    await it('should handle Error', async function () {
        const expected: ApiErrorResponse = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'some error',
        };

        const server = buildServer(handlerFactory(new Error(expected.message)));
        await request(server).get('/').expect(expected.status).expect(expected);
    });

    await it('should handle objects', async function () {
        const expected: ApiErrorResponse = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error',
        };

        const server = buildServer(handlerFactory({}));
        await request(server).get('/').expect(expected.status).expect(expected);
    });

    for (const [status, code, message, expectedStatus, expectedCode, expectedMessage] of [
        ['400', 'CODE', 'MESSAGE', 500, 'CODE', 'MESSAGE'],
        [400, 'CODE', 'MESSAGE', 400, 'CODE', 'MESSAGE'],
        [500, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
        [undefined, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
        [300, undefined, undefined, 300, 'UNKNOWN_ERROR', 'Unknown error'],
        [600, undefined, undefined, 600, 'UNKNOWN_ERROR', 'Unknown error'],
    ] as const) {
        await it(`should handle error-like objects (${status}/${code}/${message} => ${expectedStatus}/${expectedCode})`, async function () {
            const expected: ApiErrorResponse = {
                success: false,
                status: expectedStatus,
                code: expectedCode,
                message: expectedMessage,
            };

            const e: Record<string, string | number | undefined> = { status };
            if (code) {
                e['code'] = code;
            }

            if (message) {
                e['message'] = message;
            }

            const server = buildServer(handlerFactory(e));
            await request(server)
                .get('/')
                .expect(expected.status >= 400 && expected.status <= 599 ? expected.status : 500)
                .expect(expected);
        });
    }

    await it('should handle overriddenError', async function () {
        const expected: ApiErrorResponse = {
            success: false,
            status: 401,
            code: 'Unauthorized',
            message: 'Unauthorized',
        };

        const server = buildServer(handlerForOverriddenError);
        await request(server).get('/').expect(expected.status).expect(expected).expect('WWW-Authenticate', 'Bearer');
    });

    for (const [status, expectedCode] of [
        [400, 'BAD_REQUEST'],
        [401, 'UNAUTHORIZED'],
        [403, 'FORBIDDEN'],
        [404, 'NOT_FOUND'],
        [405, 'METHOD_NOT_ALLOWED'],
        [413, 'REQUEST_TOO_LARGE'],
        [415, 'UNSUPPORTED_MEDIA_TYPE'],
    ] as const) {
        await it(`should handle OpenAPI errors (${status} => ${expectedCode})`, async function () {
            const expected: ApiErrorResponse = {
                success: false,
                status,
                code: expectedCode,
                message: 'Error',
                errors: [{ path: '/', message: 'Error' }],
            };

            const server = buildServer(
                handlerFactory(
                    HttpError.create({
                        status,
                        path: '/',
                        message: expected.message,
                    }),
                ),
            );

            await request(server).get('/').expect(expected.status).expect(expected);
        });
    }

    await it('should handle additional headers in OpenAPI errors', async function () {
        const server = buildServer(
            handlerFactory(
                new MethodNotAllowed({
                    path: '/',
                    message: '',
                    headers: {
                        Allow: 'TRACE',
                    },
                }),
            ),
        );

        await request(server).get('/').expect(405).expect('Allow', 'TRACE');
    });

    await it('should gracefully handle unknown OpenAPI errors', async function () {
        const expected: ApiErrorResponse = {
            success: false,
            status: 418,
            code: 'UNKNOWN_ERROR',
            message: '',
            errors: [{ path: '/' }],
        };

        const server = buildServer(
            handlerFactory(new InternalServerError({ overrideStatus: expected.status, path: '/' })),
        );

        await request(server).get('/').expect(expected.status).expect(expected);
    });

    for (const [status, expectedCode, expectedMessage] of [
        [400, 'BAD_REQUEST', 'Request validation failed'],
        [401, 'UNAUTHORIZED', 'You are not authorized to perform this request'],
        [403, 'FORBIDDEN', 'Access denied'],
        [404, 'NOT_FOUND', 'Not found'],
        [405, 'METHOD_NOT_ALLOWED', 'Method not allowed'],
        [413, 'REQUEST_TOO_LARGE', 'Request entity too large'],
        [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
    ] as const) {
        await it(`should handle OpenAPI errors (${status} => ${expectedCode} / ${expectedMessage})`, async function () {
            const expected: ApiErrorResponse = {
                success: false,
                status,
                code: expectedCode,
                message: expectedMessage,
                errors: [{ path: '/' }],
            };

            const server = buildServer(
                handlerFactory(
                    HttpError.create({
                        status,
                        path: '/',
                    }),
                ),
            );

            await request(server).get('/').expect(expected.status).expect(expected);
        });
    }

    for (const [status, type, expectedCode, expectedMessage] of [
        [400, 'entity.parse.failed', 'BAD_REQUEST', 'Request validation failed'],
        [400, 'request.aborted', 'BAD_REQUEST', 'Request validation failed'],
        [400, 'request.size.invalid', 'BAD_REQUEST', 'Request validation failed'],
        [403, 'entity.verify.failed', 'FORBIDDEN', 'Access denied'],
        [413, 'entity.too.large', 'REQUEST_TOO_LARGE', 'Request entity too large'],
        [413, 'parameters.too.many', 'REQUEST_TOO_LARGE', 'Request entity too large'],
        [415, 'encoding.unsupported', 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
        [415, 'charset.unsupported', 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
    ] as const) {
        await it(`should handle SyntaxError (${status} => ${expectedCode} / ${expectedMessage})`, async function () {
            const expected: ApiErrorResponse = {
                success: false,
                status,
                code: expectedCode,
                message: expectedMessage,
            };

            const err: SyntaxError & { status?: number; type?: string } = new SyntaxError();
            err.status = status;
            err.type = type;

            const server = buildServer(handlerFactory(err));

            await request(server).get('/').expect(expected.status).expect(expected);
        });
    }

    await it('should handle unknown syntax errors', async function () {
        const expected: ApiErrorResponse = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error',
        };

        const err: SyntaxError & { status?: number; type?: string } = new SyntaxError();
        err.type = 'stream.not.readable';

        const server = buildServer(handlerFactory(err));

        await request(server).get('/').expect(expected.status).expect(expected);
    });

    for (const status of [502, 503, 504]) {
        await it(`should send 500 for status=${status}`, async function () {
            const expected: ApiErrorResponse = {
                success: false,
                status,
                code: 'UNKNOWN_ERROR',
                message: 'Unknown error',
            };

            const server = buildServer(handlerFactory(expected));
            await request(server).get('/').expect(500).expect(expected);
        });
    }

    await it('should allow to intercept the error', async function () {
        const expected = {
            success: true,
            message: 'Intercepted',
        };

        const beforeSendHook: ErrorMiddlewareOptions['beforeSendHook'] = (_error, _origError, _req, res): boolean => {
            res.json(expected);
            return false;
        };

        const server = express();
        server.set('mode', 'production');
        server.use(handlerFactory({}));
        server.use(errorMiddleware({ beforeSendHook }));

        await request(server as RequestListener)
            .get('/')
            .expect(200)
            .expect(expected);
    });
});
