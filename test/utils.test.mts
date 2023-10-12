import { expect } from 'chai';
import { badGatewayFromError } from '../lib/index.mjs';

describe('badGatewayFromError', function () {
    it('should return the expected response', function () {
        const expected = {
            success: false,
            status: 502,
            code: 'BAD_GATEWAY',
            message: 'Error message',
        };

        const error = new Error(expected.message);
        expect(badGatewayFromError(error)).to.deep.equal(expected);
    });
});
