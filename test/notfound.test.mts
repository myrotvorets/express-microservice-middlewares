import type { RequestListener } from 'node:http';
import request from 'supertest';
import express from 'express';
import { errorMiddleware, notFoundMiddleware } from '../lib/index.mjs';

function buildServer(): RequestListener {
    const server = express();
    server.get('/test', (_req, res, next) => {
        res.json({ success: true });
        next();
    });
    server.use(notFoundMiddleware);
    server.use(errorMiddleware());
    return server as RequestListener;
}

describe('notFoundMiddleware', function () {
    it('should return a proper payload', function () {
        const server = buildServer();
        return request(server)
            .get('/')
            .expect(404)
            .expect({ success: false, status: 404, code: 'NOT_FOUND', message: 'Not found' });
    });

    it('should honor request.route', function () {
        const server = buildServer();
        return request(server).get('/test').expect(200).expect({ success: true });
    });
});
