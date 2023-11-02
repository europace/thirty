import { APIGatewayProxyEvent } from 'aws-lambda';

import { eventType, compose } from '../core';
import { sanitizeHeaders } from './index';

let handler;

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    sanitizeHeaders(),
  )(async (event) => {
    return event.sanitizedHeaders;
  });
});

it('should return sanitized headers', async () => {
  const sanitizedHeaders = await handler({ headers: { A: 1, b: 2, Cd: 3, 'T-e-S-t': 4 } });
  expect(sanitizedHeaders).toEqual({ a: 1, b: 2, cd: 3, 't-e-s-t': 4 });
});

it('should not throw and should return empty object if headers are falsy', async () => {
  await expect(handler({})).resolves.toEqual({});
});
