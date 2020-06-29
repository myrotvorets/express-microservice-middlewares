import request from 'supertest';
import express from 'express';
import { errorMiddleware, notFoundMiddleware } from '..';

function buildServer(): express.Application {
    const server = express();
    server.use(notFoundMiddleware);
    server.use(errorMiddleware);
    return server;
}

describe('notFoundMiddleware', (): void => {
    it('should return a proper payload', (): Promise<unknown> => {
        const server = buildServer();
        return request(server)
            .get('/')
            .expect(404)
            .expect({ success: false, status: 404, code: 'NOT_FOUND', message: 'Not found' });
    });
});
