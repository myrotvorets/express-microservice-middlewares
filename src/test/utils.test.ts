import express from 'express';
import request from 'supertest';
import * as m from '..';

describe('badGatewayFromError', (): void => {
    it('should return the expected response', (): void => {
        const expected = {
            success: false,
            status: 502,
            code: 'BAD_GATEWAY',
            message: 'Error message',
        };

        const error = new Error(expected.message);
        expect(m.badGatewayFromError(error)).toEqual(expected);
    });
});

describe('helpers', () => {
    function buildServer(): express.Application {
        const server = express();
        return server;
    }

    function middleware1(req: express.Request, res: express.Response, next: express.NextFunction): void {
        res.append('Middleware', 'M1');
        next();
    }

    function middleware2(req: express.Request, res: express.Response): void {
        res.append('Middleware', 'M2');
        res.send('');
    }

    it('should run all middlewares (all)', () => {
        const server = buildServer();
        m.all(server, '/path', middleware1, middleware2);
        return request(server).get('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (use)', () => {
        const server = buildServer();
        m.use(server, '/path', middleware1, middleware2);
        return request(server).get('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (get)', () => {
        const server = buildServer();
        m.get(server, '/path', middleware1, middleware2);
        return request(server).get('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (post)', () => {
        const server = buildServer();
        m.post(server, '/path', middleware1, middleware2);
        return request(server).post('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (put)', () => {
        const server = buildServer();
        m.put(server, '/path', middleware1, middleware2);
        return request(server).put('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (delete)', () => {
        const server = buildServer();
        m.del(server, '/path', middleware1, middleware2);
        return request(server).delete('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (patch)', () => {
        const server = buildServer();
        m.patch(server, '/path', middleware1, middleware2);
        return request(server).patch('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (options)', () => {
        const server = buildServer();
        m.options(server, '/path', middleware1, middleware2);
        return request(server).options('/path').expect(200).expect('Middleware', 'M1, M2');
    });

    it('should run all middlewares (head)', () => {
        const server = buildServer();
        m.head(server, '/path', middleware1, middleware2);
        return request(server).head('/path').expect(200).expect('Middleware', 'M1, M2');
    });
});
