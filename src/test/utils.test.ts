import { badGatewayFromError } from '../';

describe('badGatewayFromError', (): void => {
    it('should return the expected response', (): void => {
        const expected = {
            success: false,
            status: 502,
            code: 'BAD_GATEWAY',
            message: 'Error message',
        };

        const error = new Error(expected.message);
        expect(badGatewayFromError(error)).toEqual(expected);
    });
});
