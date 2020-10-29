import request from 'supertest';
import express from 'express';
import { addJsonContentTypeMiddleware } from '..';

function buildServer(): express.Application {
    const server = express();
    server.use('/nojson', (req, res) => res.send('{ "hello": "world" }'));
    server.use(addJsonContentTypeMiddleware);
    server.use('/json', (req, res) => res.send('{ "hello": "world" }'));
    return server;
}

describe('addJsonContentTypeMiddleware', (): void => {
    it('should add proper Content-Type', () => {
        const server = buildServer();
        return request(server).get('/json').expect(200).expect('Content-Type', /json/u).expect({ hello: 'world' });
    });

    it('should pass the sanity check', () => {
        const server = buildServer();
        return request(server)
            .get('/nojson')
            .expect(200)
            .expect((r) => {
                expect(r.get('content-type')).not.toMatch(/json/u);
                expect(r.body).toEqual({});
            });
    });
});
