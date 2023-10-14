import request from 'supertest';
import express from 'express';
import { numberParamHandler } from '../lib/index.mjs';

describe('numberParamHandler', function () {
    it('should convert parameters to numbers', function () {
        const server = express();
        server.param('id', numberParamHandler);
        server.get('/:id', (req, res) => res.json({ id: req.params.id }));
        return request(server).get('/123').expect(200).expect('Content-Type', /json/u).expect({ id: 123 });
    });
});
