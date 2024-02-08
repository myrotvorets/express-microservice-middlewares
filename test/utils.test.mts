import { expect } from 'chai';
import { ApiError, badGatewayFromError } from '../lib/index.mjs';

describe('badGatewayFromError', function () {
    it('should return the expected response', function () {
        const expected = {
            status: 502,
            code: 'BAD_GATEWAY',
            message: 'Error message',
        };

        const error = new Error(expected.message);
        const actual = badGatewayFromError(error);
        expect(actual).to.be.instanceOf(ApiError).that.includes({
            status: expected.status,
            code: expected.code,
            errorMessage: expected.message,
        });

        expect(actual.cause).to.deep.equal(error);
    });
});
