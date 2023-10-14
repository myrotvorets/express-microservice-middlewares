import request from 'supertest';
import express, { type Express, type NextFunction, type Request, RequestHandler, type Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types.js';
import { type ErrorMiddlewareOptions, ErrorResponse, errorMiddleware, errorMiddlewareEx } from '../lib/index.mjs';

function buildServer(fn: RequestHandler): Express {
    const server = express();
    server.set('env', 'test');
    server.use(fn);
    server.use(errorMiddleware);
    return server;
}

const handlerFactory =
    (err: unknown): RequestHandler =>
    (_req, _res, next): void =>
        next(err);

function handlerForOverriddenError(req: Request, _res: Response, next: NextFunction): void {
    req.overriddenError = {
        success: false,
        status: 401,
        code: 'Unauthorized',
        message: 'Unauthorized',
        additionalHeaders: {
            'WWW-Authenticate': 'Bearer',
        },
    };

    next(new Error('some error'));
}

describe('Error', function () {
    describe('errorMiddleware', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        [123, 'string', [], Infinity, -Infinity].forEach((e: unknown) =>
            it(`should invoke the default handler (${e})`, function () {
                const server = buildServer(handlerFactory(e));
                return request(server)
                    .get('/')
                    .expect(500)
                    .expect(/<!DOCTYPE html/u)
                    .expect(/<title>Error<\/title>/u);
            }),
        );

        // eslint-disable-next-line mocha/no-setup-in-describe
        [null, undefined, false, '', 0, NaN].forEach((e: unknown) =>
            it(`should invoke the default 404 handler (${e})`, function () {
                const server = buildServer(handlerFactory(e));
                return request(server)
                    .get('/')
                    .expect(404)
                    .expect(/<!DOCTYPE html/u)
                    .expect(/<title>Error<\/title>/u);
            }),
        );

        it('should handle Error', function () {
            const expected: ErrorResponse = {
                success: false,
                status: 500,
                code: 'UNKNOWN_ERROR',
                message: 'some error',
            };

            const server = buildServer(handlerFactory(new Error(expected.message)));
            return request(server).get('/').expect(expected.status).expect(expected);
        });

        it('should handle objects', function () {
            const expected: ErrorResponse = {
                success: false,
                status: 500,
                code: 'UNKNOWN_ERROR',
                message: 'Unknown error',
            };

            const server = buildServer(handlerFactory({}));
            return request(server).get('/').expect(expected.status).expect(expected);
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['400', 'CODE', 'MESSAGE', 400, 'CODE', 'MESSAGE'],
                [400, 'CODE', 'MESSAGE', 400, 'CODE', 'MESSAGE'],
                [500, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
                [undefined, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
                [300, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
                [600, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
            ] as const
        ).forEach(([status, code, message, expectedStatus, expectedCode, expectedMessage]) =>
            it(`should handle error-like objects (${status}/${code}/${message} => ${expectedStatus}/${expectedCode})`, function () {
                const expected: ErrorResponse = {
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
                return request(server).get('/').expect(expected.status).expect(expected);
            }),
        );

        it('should handle overriddenError', function () {
            const expected: ErrorResponse = {
                success: false,
                status: 401,
                code: 'Unauthorized',
                message: 'Unauthorized',
            };

            const server = buildServer(handlerForOverriddenError);
            return request(server)
                .get('/')
                .expect(expected.status)
                .expect(expected)
                .expect('WWW-Authenticate', 'Bearer');
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                [400, 'BAD_REQUEST'],
                [401, 'UNAUTHORIZED'],
                [403, 'FORBIDDEN'],
                [404, 'NOT_FOUND'],
                [405, 'METHOD_NOT_ALLOWED'],
                [413, 'REQUEST_TOO_LARGE'],
                [415, 'UNSUPPORTED_MEDIA_TYPE'],
            ] as const
        ).forEach(([status, expectedCode]) =>
            it(`should handle OpenAPI errors (${status} => ${expectedCode})`, function () {
                const expected: ErrorResponse = {
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

                return request(server).get('/').expect(expected.status).expect(expected);
            }),
        );

        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                [400, 'BAD_REQUEST', 'Request validation failed'],
                [401, 'UNAUTHORIZED', 'You are not authorized to perform this request'],
                [403, 'FORBIDDEN', 'Access denied'],
                [404, 'NOT_FOUND', 'Not found'],
                [405, 'METHOD_NOT_ALLOWED', 'Method not allowed'],
                [413, 'REQUEST_TOO_LARGE', 'Request entity too large'],
                [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
            ] as const
        ).forEach(([status, expectedCode, expectedMessage]) =>
            it(`should handle OpenAPI errors (${status} => ${expectedCode} / ${expectedMessage})`, function () {
                const expected: ErrorResponse = {
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

                return request(server).get('/').expect(expected.status).expect(expected);
            }),
        );

        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                [400, 'entity.parse.failed', 'BAD_REQUEST', 'Request validation failed'],
                [400, 'request.aborted', 'BAD_REQUEST', 'Request validation failed'],
                [400, 'request.size.invalid', 'BAD_REQUEST', 'Request validation failed'],
                [403, 'entity.verify.failed', 'FORBIDDEN', 'Access denied'],
                [413, 'entity.too.large', 'REQUEST_TOO_LARGE', 'Request entity too large'],
                [413, 'parameters.too.many', 'REQUEST_TOO_LARGE', 'Request entity too large'],
                [415, 'encoding.unsupported', 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
                [415, 'charset.unsupported', 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
            ] as const
        ).forEach(([status, type, expectedCode, expectedMessage]) =>
            it(`should handle SyntaxError (${status} => ${expectedCode} / ${expectedMessage})`, function () {
                const expected: ErrorResponse = {
                    success: false,
                    status,
                    code: expectedCode,
                    message: expectedMessage,
                };

                const err: SyntaxError & { status?: number; type?: string } = new SyntaxError();
                err.status = status;
                err.type = type;

                const server = buildServer(handlerFactory(err));

                return request(server).get('/').expect(expected.status).expect(expected);
            }),
        );

        it('should handle unknown syntax errors', function () {
            const expected: ErrorResponse = {
                success: false,
                status: 500,
                code: 'UNKNOWN_ERROR',
                message: 'Unknown error',
            };

            const err: SyntaxError & { status?: number; type?: string } = new SyntaxError();
            err.type = 'stream.not.readable';

            const server = buildServer(handlerFactory(err));

            return request(server).get('/').expect(expected.status).expect(expected);
        });
    });

    describe('ErrorMiddlewareEx', function () {
        it('should allow to intercept the error', function () {
            const expected = {
                success: true,
                message: 'Intercepted',
            };

            const beforeSendHook: ErrorMiddlewareOptions['beforeSendHook'] = (
                _error,
                _origError,
                _req,
                res,
            ): boolean => {
                res.json(expected);
                return false;
            };

            const server = express();
            server.set('mode', 'production');
            server.use(handlerFactory({}));
            server.use(errorMiddlewareEx({ beforeSendHook }));

            return request(server).get('/').expect(200).expect(expected);
        });
    });
});
