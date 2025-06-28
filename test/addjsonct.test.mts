import assert, { deepEqual, doesNotMatch } from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RequestListener } from 'node:http';
import request from 'supertest';
import express from 'express';
import { addJsonContentTypeMiddleware } from '../lib/index.mjs';

function buildServer(): RequestListener {
    const server = express();
    server.use('/nojson', (_req, res) => {
        res.send('{ "hello": "world" }');
    });
    server.use(addJsonContentTypeMiddleware);
    server.use('/json', (_req, res) => {
        res.send('{ "hello": "world" }');
    });
    return server as RequestListener;
}

await describe('addJsonContentTypeMiddleware', async function () {
    await it('should add proper Content-Type', async function () {
        const server = buildServer();
        await request(server).get('/json').expect(200).expect('Content-Type', /json/u).expect({ hello: 'world' });
    });

    await it('should pass the sanity check', async function () {
        const server = buildServer();
        await request(server)
            .get('/nojson')
            .expect(200)
            .expect((r) => {
                const contentType = r.get('content-type');
                assert(typeof contentType === 'string');
                doesNotMatch(contentType, /json/u);
                deepEqual(r.body, {});
            });
    });
});
