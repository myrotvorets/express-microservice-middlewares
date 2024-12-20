import type { RequestListener } from 'node:http';
import { expect } from 'chai';
import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { debugErrorMiddleware } from '../lib/index.mjs';

function buildServer(fn: RequestHandler): RequestListener {
    const server = express();
    server.set('mode', 'production');
    server.use(fn);
    server.use(debugErrorMiddleware);
    return server as RequestListener;
}

const handlerFactory =
    (err: unknown): RequestHandler =>
    (_req, _res, next): void =>
        next(err);

describe('debugErrorMiddleware', function () {
    let origWarn: typeof console.warn;
    let origError: typeof console.error;
    let calls: number;

    beforeEach(function () {
        origWarn = console.warn;
        origError = console.error;
        calls = 0;

        console.warn = (): void => {
            ++calls;
        };

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        console.error = (): void => {};
    });

    afterEach(function () {
        console.warn = origWarn;
        console.error = origError;
    });

    it('should display a message', function () {
        const server = buildServer(handlerFactory(new Error('Some error')));
        return request(server)
            .get('/')
            .expect(() => expect(calls).to.equal(1));
    });
});
