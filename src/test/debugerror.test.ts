import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import request from 'supertest';
import { debugErrorMiddleware } from '..';

function buildServer(fn: RequestHandler): express.Application {
    const server = express();
    server.set('mode', 'production');
    server.use(fn);
    server.use(debugErrorMiddleware);
    return server;
}

function handlerFactory(err: unknown): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => next(err);
}

const spy = jest.spyOn(console, 'warn').mockImplementation();
afterAll(() => spy.mockRestore());

describe('debugErrorMiddleware', (): void => {
    it('should display a message', (): Promise<unknown> => {
        const server = buildServer(handlerFactory(new Error('Some error')));
        return request(server)
            .get('/')
            .then(() => {
                expect(spy).toHaveBeenCalledTimes(1);
            });
    });
});
