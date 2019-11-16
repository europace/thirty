import Csrf from 'csrf';
import { XSRF_HEADER_NAME, xsrfCheck } from './index';
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;
import { compose, eventType } from '../core';
import { UnauthorizedError } from '../errors/UnauthorizedError';

let handler;
let token;
let spy: Spy;
const secret = 'test';

beforeEach(() => {
  token = new Csrf({ saltLength: 256 }).create(secret);
  spy = createSpy();
  handler = compose(
    eventType<{}>(),
    xsrfCheck({
      getSecret: () => secret,
    }),
  )(async () => {
    spy();
  });
});

it('should resolve due to valid XSRF token', async () => {
  await expect(handler({ headers: { [XSRF_HEADER_NAME]: token } })).resolves.toEqual(undefined);
  expect(spy).toHaveBeenCalled();
});

it('should throw due to missing XSRF token', async () => {
  await expect(handler({ headers: {} })).rejects.toThrow(UnauthorizedError);
  expect(spy).not.toHaveBeenCalled();
});

it('should throw due to invalid XSRF token', async () => {
  await expect(handler({ headers: { [XSRF_HEADER_NAME]: 'invalid' } })).rejects.toThrow(
    UnauthorizedError,
  );
  expect(spy).not.toHaveBeenCalled();
});
