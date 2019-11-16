import { APIGatewayProxyEvent } from 'aws-lambda';
import { serialize } from 'cookie';

import { cookieParser } from './index';
import { compose, eventType } from '../core';

let handler;

beforeAll(() => {
  handler = compose(
    eventType<APIGatewayProxyEvent>(),
    cookieParser(),
  )(async event => {
    return event.cookie;
  });
});

it('should return cookie object', async () => {
  const cookieObject = await handler({ headers: { Cookie: serialize('test', '1') } });
  expect(cookieObject).toEqual({ test: '1' });
});
