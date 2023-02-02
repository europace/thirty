import Csrf from 'csrf';
import { XSRF_HEADER_NAME, verifyXsrfToken } from './index';
import { compose, eventType } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';

let handler;
let token;
let spy: jest.Mock;
const secret = 'test';

beforeEach(() => {
  token = new Csrf({ saltLength: 256 }).create(secret);
  spy = jest.fn();
  handler = compose(
    eventType<{}>(),
    verifyXsrfToken({
      getSecret: () => secret,
    }),
  )(async () => {
    spy();
  });
});

it('should resolve due to valid XSRF token', async () => {
  await expect(handler({ sanitizedHeaders: { [XSRF_HEADER_NAME]: token } })).resolves.toEqual(
    undefined,
  );
  expect(spy).toHaveBeenCalled();
});

it('should throw due to missing XSRF token', async () => {
  await expect(handler({ sanitizedHeaders: {} })).rejects.toThrow(UnauthorizedError);
  expect(spy).not.toHaveBeenCalled();
});

it('should throw due to invalid XSRF token', async () => {
  await expect(handler({ sanitizedHeaders: { [XSRF_HEADER_NAME]: 'invalid' } })).rejects.toThrow(
    UnauthorizedError,
  );
  expect(spy).not.toHaveBeenCalled();
});
