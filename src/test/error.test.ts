import request from 'supertest';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import { ErrorResponse, errorMiddleware } from '..';

function buildServer(fn: RequestHandler): express.Application {
    const server = express();
    server.set('mode', 'production');
    server.use(fn);
    server.use(errorMiddleware);
    return server;
}

function handlerFactory(err: unknown): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => next(err);
}

function handlerForOverriddenError(req: Request, res: Response, next: NextFunction): void {
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

describe('errorMiddleware', (): void => {
    it.each([[123], ['string'], [[]], [Infinity], [-Infinity]])(
        'should invoke the default handler (%p)',
        (e: unknown): Promise<unknown> => {
            const server = buildServer(handlerFactory(e));
            return request(server)
                .get('/')
                .expect(500)
                .expect(/<!DOCTYPE html/u)
                .expect(/<title>Error<\/title>/u);
        },
    );

    it.each([[null], [undefined], [false], [''], [0], [NaN]])(
        'should invoke the default 404 handler (%p)',
        (e: unknown): Promise<unknown> => {
            const server = buildServer(handlerFactory(e));
            return request(server)
                .get('/')
                .expect(404)
                .expect(/<!DOCTYPE html/u)
                .expect(/<title>Error<\/title>/u);
        },
    );

    it('should handle Error', (): Promise<unknown> => {
        const expected: ErrorResponse = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'some error',
        };

        const server = buildServer(handlerFactory(new Error(expected.message)));
        return request(server).get('/').expect(expected.status).expect(expected);
    });

    it('should handle objects', (): Promise<unknown> => {
        const expected: ErrorResponse = {
            success: false,
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error',
        };

        const server = buildServer(handlerFactory({}));
        return request(server).get('/').expect(expected.status).expect(expected);
    });

    it.each([
        ['400', 'CODE', 'MESSAGE', 400, 'CODE', 'MESSAGE'],
        [400, 'CODE', 'MESSAGE', 400, 'CODE', 'MESSAGE'],
        [500, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
        [undefined, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
        [300, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
        [600, undefined, undefined, 500, 'UNKNOWN_ERROR', 'Unknown error'],
    ])(
        'should handle error-like objects (%d/%p/%p => %s/%s)',
        (status, code, message, expectedStatus, expectedCode, expectedMessage): Promise<unknown> => {
            const expected: ErrorResponse = {
                success: false,
                status: expectedStatus,
                code: expectedCode,
                message: expectedMessage,
            };

            const e: Record<string, string | number | undefined> = { status };
            if (code) {
                e.code = code;
            }

            if (message) {
                e.message = message;
            }

            const server = buildServer(handlerFactory(e));
            return request(server).get('/').expect(expected.status).expect(expected);
        },
    );

    it('should handle overriddenError', (): Promise<unknown> => {
        const expected: ErrorResponse = {
            success: false,
            status: 401,
            code: 'Unauthorized',
            message: 'Unauthorized',
        };

        const server = buildServer(handlerForOverriddenError);
        return request(server).get('/').expect(expected.status).expect(expected).expect('WWW-Authenticate', 'Bearer');
    });

    it.each([
        [400, 'BAD_REQUEST'],
        [401, 'UNAUTHORIZED'],
        [403, 'FORBIDDEN'],
        [404, 'NOT_FOUND'],
        [405, 'METHOD_NOT_ALLOWED'],
        [413, 'REQUEST_TOO_LARGE'],
        [415, 'UNSUPPORTED_MEDIA_TYPE'],
    ])(
        'should handle OpenAPI errors (%d => %s)',
        (status: number, expectedCode: string): Promise<unknown> => {
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
        },
    );

    it.each([
        [400, 'BAD_REQUEST', 'Request validation failed'],
        [401, 'UNAUTHORIZED', 'You are not authorized to perform this request'],
        [403, 'FORBIDDEN', 'Access denied'],
        [404, 'NOT_FOUND', 'Not found'],
        [405, 'METHOD_NOT_ALLOWED', 'Method not allowed'],
        [413, 'REQUEST_TOO_LARGE', 'Request entity too large'],
        [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'],
    ])(
        'should handle OpenAPI errors (%d => %s / %s)',
        (status: number, expectedCode: string, expectedMessage: string): Promise<unknown> => {
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
        },
    );
});
