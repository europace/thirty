import { APIGatewayProxyEvent } from 'aws-lambda';
import { serialize } from 'cookie';

import { parseCookie } from './index';
import { compose, eventType } from '../core';

let handler;

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    parseCookie(),
  )(async event => {
    return event.cookie;
  });
});

it('should return cookie object', async () => {
  const cookieObject = await handler({ headers: { Cookie: serialize('test', '1') } });
  expect(cookieObject).toEqual({ test: '1' });
});
