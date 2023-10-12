import { expect } from 'chai';
import request from 'supertest';
import express, { type Express } from 'express';
import { addJsonContentTypeMiddleware } from '../lib/index.mjs';

function buildServer(): Express {
    const server = express();
    server.use('/nojson', (_req, res) => res.send('{ "hello": "world" }'));
    server.use(addJsonContentTypeMiddleware);
    server.use('/json', (_req, res) => res.send('{ "hello": "world" }'));
    return server;
}

describe('addJsonContentTypeMiddleware', function () {
    it('should add proper Content-Type', function () {
        const server = buildServer();
        return request(server).get('/json').expect(200).expect('Content-Type', /json/u).expect({ hello: 'world' });
    });

    it('should pass the sanity check', function () {
        const server = buildServer();
        return request(server)
            .get('/nojson')
            .expect(200)
            .expect((r) => {
                expect(r.get('content-type')).not.to.match(/json/u);
                expect(r.body).to.deep.equal({});
            });
    });
});
